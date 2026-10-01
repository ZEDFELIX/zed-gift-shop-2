import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { stkPush } from "@/lib/mpesa";
import { phoneSchema } from "@/lib/validations";
import { updateOrderStatus, updatePaymentStatus, reserveInventoryForOrder, releaseInventoryForOrder } from "@/lib/data/orders";
import { recordPaymentEvent, syncOrderToPaymentStatus } from "@/lib/payments";

const schema = z.object({
  phone: z.string().min(9).max(15).pipe(phoneSchema),
  amount: z.number().nonnegative().max(1_000_000),
  accountReference: z.string().min(1).max(20),
  orderId: z.string().min(1).max(64),
});

export async function POST(req: Request) {
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

  const { phone, accountReference, orderId } = parsed.data;

  // Verify the order exists and is unpaid.
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      orderStatus: true,
      paymentStatus: true,
      total: true,
      payments: { select: { id: true, status: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
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