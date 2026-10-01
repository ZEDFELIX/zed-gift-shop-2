import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { confirmOrderPaid, releaseInventoryForOrder } from "@/lib/data/orders";
import { sendOrderConfirmation } from "@/lib/email";
import { queryStkStatus, webhookSecretMatches } from "@/lib/mpesa";
import {
  amountSatisfies,
  isFinal,
  recordPaymentEvent,
  syncOrderToPaymentStatus,
  transitionPayment,
} from "@/lib/payments";
import { SITE } from "@/lib/constants";

export const runtime = "nodejs";

function ack() {
  return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" });
}

type CallbackItem = { Name: string; Value?: string | number };
type DarajaCallback = {
  Body?: {
    stkCallback?: {
      MerchantRequestID?: string;
      CheckoutRequestID?: string;
      ResultCode?: number | string;
      ResultDesc?: string;
      CallbackMetadata?: { Item?: CallbackItem[] };
    };
  };
};

function samePhone(a: string, b: string): boolean {
  const digits = (v: string) => v.replace(/\D/g, "");
  const x = digits(a);
  const y = digits(b);
  if (!x || !y) return true; // Nothing to compare against; do not fail on absence.
  // Compare on the local subscriber portion so +254... and 07... both match.
  const local = (v: string) => (v.startsWith("254") ? `0${v.slice(3)}` : v);
  return local(x) === local(y);
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!webhookSecretMatches(authHeader)) {
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Unauthorized" }, { status: 401 });
  }

  let raw: DarajaCallback;
  try {
    raw = (await req.json()) as DarajaCallback;
  } catch {
    return ack(); // Malformed body: ack so Daraja does not retry forever.
  }

  const cb = raw.Body?.stkCallback;
  if (!cb?.CheckoutRequestID) return ack();

  const payment = await prisma.payment.findFirst({
    where: { checkoutRequestId: cb.CheckoutRequestID },
  });
  if (!payment) return ack();

  // Keep the raw payload for audit regardless of the outcome.
  await prisma.payment.update({
    where: { id: payment.id },
    data: { rawCallbackJson: JSON.stringify(raw) },
  });

  // A settled payment must not be disturbed by a replayed or late callback.
  if (isFinal(payment.status)) return ack();

  const phone = payment.phone;

  /**
   * The callback body is a notification, not proof of payment. Ask Daraja
   * directly and let its answer decide the outcome.
   */
  const query = await queryStkStatus({ checkoutRequestId: cb.CheckoutRequestID, phone });
  if (!query.ok && query.error) {
    // A transport or config problem must not fail the payment. Leave it in
    // PROCESSING so the poller or a later callback can still settle it.
    await recordPaymentEvent(payment.id, {
      toStatus: payment.status,
      source: "mpesa-callback",
      note: `Daraja verification unavailable: ${query.error}`,
    });
    return ack();
  }

  const resultCode = query.resultCode ?? String(cb.ResultCode ?? "");
  const description = query.resultDescription ?? cb.ResultDesc ?? null;

  if (!query.ok) {
    const applied = await transitionPayment({
      paymentId: payment.id,
      to: "FAILED",
      source: "daraja-query",
      note: description ?? `M-PESA error ${resultCode}`,
      metadata: { resultCode },
      patch: { resultCode: Number(resultCode) || null, resultDescription: description },
    });
    if (applied) {
      await syncOrderToPaymentStatus(payment.orderId, "FAILED");
      await releaseInventoryForOrder(payment.orderId);
    }
    return ack();
  }

  // Daraja says the charge succeeded. Every field still has to line up with the
  // order we created before the customer is considered paid.
  const problems: string[] = [];
  if (!amountSatisfies(payment.amount, query.amount)) {
    problems.push(`Amount mismatch: expected ${payment.amount}, Daraja reported ${query.amount ?? "none"}.`);
  }
  if (!query.mpesaReceipt) {
    problems.push("Daraja returned no M-Pesa receipt number.");
  }
  if (query.phone && !samePhone(query.phone, phone)) {
    problems.push(`Paying phone ${query.phone} does not match the order phone.`);
  }

  if (problems.length > 0) {
    await recordPaymentEvent(payment.id, {
      toStatus: payment.status,
      source: "daraja-query",
      note: `Verification rejected: ${problems.join(" ")}`,
      metadata: { reportedAmount: query.amount, reportedPhone: query.phone },
    });
    return ack();
  }

  // The unique constraint on mpesaReceipt is the final idempotency guard: if a
  // receipt was already recorded against another payment, this cannot settle.
  let existingReceipt: { id: string; orderId: string } | null = null;
  try {
    existingReceipt = await prisma.payment.findUnique({
      where: { mpesaReceipt: query.mpesaReceipt! },
      select: { id: true, orderId: true },
    });
  } catch {
    existingReceipt = null;
  }

  if (existingReceipt && existingReceipt.id !== payment.id) {
    await recordPaymentEvent(payment.id, {
      toStatus: payment.status,
      source: "daraja-query",
      note: `Receipt ${query.mpesaReceipt} is already recorded against a different payment.`,
    });
    return ack();
  }

  const applied = await transitionPayment({
    paymentId: payment.id,
    to: "SUCCESSFUL",
    source: "daraja-query",
    note: description ?? "Confirmed by Daraja STK query.",
    metadata: {
      resultCode,
      amount: query.amount,
      mpesaReceipt: query.mpesaReceipt,
      phone: query.phone,
    },
    patch: {
      mpesaReceipt: query.mpesaReceipt,
      resultCode: Number(resultCode) || null,
      resultDescription: description,
      transactionDate: query.transactionDate ?? null,
      completedAt: new Date(),
    },
  });

  if (!applied) return ack(); // Lost the race against a concurrent callback.

  await confirmOrderPaid(payment.orderId, payment.id, query.mpesaReceipt!);
  await syncOrderToPaymentStatus(payment.orderId, "SUCCESSFUL");

  const order = await prisma.order.findUnique({
    where: { id: payment.orderId },
    include: { items: true },
  });
  if (order) {
    await sendOrderConfirmation({
      to: order.email,
      orderNumber: order.orderNumber,
      total: `KES ${order.total.toLocaleString("en-KE")}`,
      items: order.items.map((i) => ({
        name: i.name,
        qty: i.quantity,
        lineTotal: `KES ${(i.price * i.quantity + i.giftWrapPrice * i.quantity).toLocaleString("en-KE")}`,
      })),
      statusUrl: `${SITE.url}/track?order=${order.orderNumber}`,
    });
  }

  return ack();
}