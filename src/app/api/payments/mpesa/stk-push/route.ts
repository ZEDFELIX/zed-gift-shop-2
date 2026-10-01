import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { stkPush } from "@/lib/mpesa";
import { phoneSchema } from "@/lib/validations";
import { updateOrderStatus, updatePaymentStatus, reserveInventoryForOrder, releaseInventoryForOrder } from "@/lib/data/orders";
import { recordPaymentEvent, syncOrderToPaymentStatus } from "@/lib/payments";
import { getSession } from "@/lib/auth";
import { verifyOrderToken } from "@/lib/order-token";
import { rateLimit } from "@/lib/rate-limit";

// A signed guest token is issued when the order is created; a signed-in owner
// may also retry. This endpoint triggers a real charge, so it must never be
// reachable by someone who merely knows an order id.
const schema = z.object({
  phone: z.string().min(9).max(15).pipe(phoneSchema),
  amount: z.number().nonnegative().max(1_000_000),
  accountReference: z.string().min(1).max(20),
  orderId: z.string().min(1).max(64),
  pollToken: z.string().max(1024).optional(),
});

function clientKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: Request) {
  const limit = await rateLimit(`mpesa-push:${clientKey(req)}`, { limit: 6, windowSeconds: 300 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many payment attempts. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

const parsed = schema.safeParse(body);
  if (!parsed.success) {
  return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const { phone, accountReference, orderId, pollToken } = parsed.data;

  // Verify the order exists and is unpaid.
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      orderStatus: true,
      paymentStatus: true,
      userId: true,
      total: true,
      payments: { select: { id: true, status: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  // Authorization: the signed-in owner of the order, or a guest holding the
  // token issued at checkout. Everything else is rejected before any charge.
  const session = await getSession();
  const ownsOrder = Boolean(session && order.userId && session.sub === order.userId);
  const hasGuestToken = verifyOrderToken(pollToken, order.id);
  if (!ownsOrder && !hasGuestToken) {
    return NextResponse.json({ error: "You are not allowed to pay for this order." }, { status: 403 });
  }

  if (order.paymentStatus === "SUCCESSFUL") {
    return NextResponse.json({ error: "Order is already paid." }, { status: 409 });
  }

  if (accountReference.toUpperCase() !== order.orderNumber) {
    return NextResponse.json({ error: "Order reference does not match." }, { status: 400 });
  }

  // Amount is authoritative from the order, never from the client.
  const amount = order.total;

  // Reuse a still-pending attempt; otherwise create a fresh payment record.
  let paymentRecord = order.payments[0];
  const reusable = paymentRecord && (paymentRecord.status === "PENDING" || paymentRecord.status === "PROCESSING");
  if (!reusable) {
    paymentRecord = await prisma.payment.create({
      data: {
        orderId,
        provider: "M_PESA",
        status: "PENDING",
        amount,
        currency: "KES",
        phone,
      },
    });
  }

  // A previously failed attempt may have cancelled the order and released stock.
  // Bring it back to a payable state so the push can complete it.
  if (order.orderStatus === "CANCELLED") {
    await updatePaymentStatus(orderId, "PENDING");
    await updateOrderStatus(orderId, "PENDING_PAYMENT");
    await reserveInventoryForOrder(orderId);
  }

  const push = await stkPush({
    phone,
    amount,
    accountReference,
    transactionDesc: `ZED Gift Shop order ${accountReference}`,
  });

  if (!push.ok) {
    await prisma.payment.update({
      where: { id: paymentRecord.id },
      data: { status: "FAILED", resultDescription: push.error ?? null, completedAt: new Date() },
    });
    await recordPaymentEvent(paymentRecord.id, {
      toStatus: "FAILED",
      source: "stk-push",
      note: push.error ?? "STK push rejected.",
    });
    await syncOrderToPaymentStatus(orderId, "FAILED");
    await releaseInventoryForOrder(orderId);
    return NextResponse.json(
      { ok: false, error: push.error ?? "M-PESA STK push failed." },
      { status: 400 }
    );
  }

  // The prompt is with the customer: the charge is in flight until Daraja
  // confirms it, so the payment moves to PROCESSING rather than sitting PENDING.
  const previousStatus = paymentRecord.status;
  await prisma.payment.update({
    where: { id: paymentRecord.id },
    data: {
      checkoutRequestId: push.checkoutRequestId,
      merchantRequestId: push.merchantRequestId ?? null,
      status: "PROCESSING",
      initiatedAt: new Date(),
      // STK prompts are valid for roughly one minute; expire abandoned attempts.
      expiredAt: new Date(Date.now() + 60 * 1000),
      resultCode: Number(push.responseCode) || null,
      resultDescription: push.responseDescription ?? null,
    },
  });

  if (previousStatus !== "PROCESSING") {
    await recordPaymentEvent(paymentRecord.id, {
      toStatus: "PROCESSING",
      source: "stk-push",
      note: "STK prompt sent; awaiting Daraja confirmation.",
      metadata: { checkoutRequestId: push.checkoutRequestId },
    });
  }

  await syncOrderToPaymentStatus(orderId, "PROCESSING");

  return NextResponse.json({
    ok: true,
    checkoutRequestId: push.checkoutRequestId,
    merchantRequestId: push.merchantRequestId,
    orderNumber: order.orderNumber,
    amount,
  });
}