import "server-only";
import { NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/validations";
import { createOrderFromCart, createPaymentForOrder } from "@/lib/checkout";
import { stkPush, mpesaConfigured } from "@/lib/mpesa";
import { initiateFlutterwaveCharge, flutterwaveConfigured } from "@/lib/flutterwave";
import { prisma } from "@/lib/prisma";
import { releaseInventoryForOrder, updateOrderStatus, updatePaymentStatus } from "@/lib/data/orders";
import { issueOrderToken } from "@/lib/order-token";
import { recordPaymentEvent, transitionPayment } from "@/lib/payments";
import { BANK_TRANSFER, getBankTransferInstructions } from "@/lib/constants";

export const runtime = "nodejs";

function addDays(from: Date, days: number): Date {
  const date = new Date(from);
  date.setDate(date.getDate() + days);
  return date;
}

export async function POST(req: Request) {
 let body: unknown;
 try {
 body = await req.json();
 } catch {
 return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
 }

 const parsed = checkoutSchema.safeParse(body);
 if (!parsed.success) {
 return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check your details." }, { status: 400 });
 }

 const result = await createOrderFromCart(parsed.data);
 if (!result.ok) {
 return NextResponse.json({ error: result.error }, { status: 409 });
 }

const { order, totals } = result;
  const paymentMethod = parsed.data.paymentMethod ?? "M_PESA";
  const phone = parsed.data.phone;
  const pollToken = issueOrderToken(order.orderId, order.orderNumber);

 // Create a payment record
 let payment: Awaited<ReturnType<typeof createPaymentForOrder>>;

 try {
 payment = await createPaymentForOrder({
 orderId: order.orderId,
 amount: totals.total,
 phone,
 });
 } catch {
 return NextResponse.json({ error: "Failed to create payment record." }, { status: 500 });
 }

// Cash on delivery: the order is real but unsettled until the rider collects.
  if (paymentMethod === "COD") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        provider: "COD",
        status: "PENDING",
        resultDescription: "To be collected on delivery.",
        initiatedAt: new Date(),
        // Cash is collected in person, so nothing is pending with a provider.
        expiredAt: addDays(new Date(), 7),
      },
    });
    await recordPaymentEvent(payment.id, {
      toStatus: "PENDING",
      source: "checkout",
      note: "Cash on delivery selected.",
    });

    return NextResponse.json({
      ok: true,
      pollToken,
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      total: totals.total,
      payment: { status: "PENDING", configured: true, method: "COD" },
    });
  }

  // Bank transfer: instructions are shown now, staff reconcile the payment.
  if (paymentMethod === "BANK_TRANSFER") {
    const bankReference = order.orderNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(-12);
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        provider: "BANK_TRANSFER",
        status: "PENDING",
        bankReference,
        resultDescription: "Awaiting bank transfer.",
        initiatedAt: new Date(),
        // Hold the order while the customer transfers, then release it.
        expiredAt: addDays(new Date(), 3),
      },
    });
    await recordPaymentEvent(payment.id, {
      toStatus: "PENDING",
      source: "checkout",
      note: "Bank transfer selected.",
      metadata: { bankReference },
    });

    return NextResponse.json({
      ok: true,
      pollToken,
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      total: totals.total,
      payment: {
        status: "PENDING",
        configured: true,
        method: "BANK_TRANSFER",
        bankReference,
        instructions: getBankTransferInstructions(bankReference),
      },
    });
  }

  // Handle M-PESA STK Push
  if (paymentMethod === "M_PESA") {
 if (!mpesaConfigured()) {
 await prisma.payment.update({
 where: { id: payment.id },
 data: { status: "FAILED", resultDescription: "M-PESA is not configured on this store." },
 });
 await releaseInventoryForOrder(order.orderId);
 await updatePaymentStatus(order.orderId, "FAILED");
 await updateOrderStatus(order.orderId, "CANCELLED");
 return NextResponse.json(
 { ok: false, error: "M-PESA is not configured on this store yet. Please contact the shop to arrange payment.", orderId: order.orderId, orderNumber: order.orderNumber, pollToken, configured: false },
 { status: 501 }
 );
 }

 const push = await stkPush({
 phone,
 amount: totals.total,
 accountReference: order.orderNumber,
 transactionDesc: "ZED Gift Shop",
 });

if (push.ok && push.checkoutRequestId) {
    // The prompt is out with the customer, so the payment is in flight rather
    // than waiting to be started. One key per prompt keeps retries idempotent.
    await transitionPayment({
      paymentId: payment.id,
      to: "PROCESSING",
      source: "stk_push",
      note: "STK prompt sent to the customer.",
      metadata: { checkoutRequestId: push.checkoutRequestId },
      patch: {
        checkoutRequestId: push.checkoutRequestId,
        merchantRequestId: push.merchantRequestId ?? null,
        idempotencyKey: push.checkoutRequestId,
        initiatedAt: new Date(),
        expiredAt: addDays(new Date(), 1),
      },
    });
return NextResponse.json({
  ok: true,
  pollToken,
  orderId: order.orderId,
  orderNumber: order.orderNumber,
  total: totals.total,
  payment: { status: "PROCESSING", checkoutRequestId: push.checkoutRequestId, merchantRequestId: push.merchantRequestId ?? null, configured: true, method: "M_PESA" },
  });
  }

 await prisma.payment.update({
 where: { id: payment.id },
 data: { status: "FAILED", resultDescription: push.error ?? null },
 });
 await releaseInventoryForOrder(order.orderId);
 await updatePaymentStatus(order.orderId, "FAILED");
 await updateOrderStatus(order.orderId, "CANCELLED");
return NextResponse.json({
  ok: false,
  pollToken,
  orderId: order.orderId,
  orderNumber: order.orderNumber,
  total: totals.total,
  payment: { status: "FAILED", error: push.error ?? "M-PESA rejected the request.", configured: true, method: "M_PESA" },
  }, { status: 502 });
 }

 // Handle Flutterwave / Card payments
 if (paymentMethod === "FLUTTERWAVE" || paymentMethod === "CARD") {
 if (!flutterwaveConfigured()) {
 await prisma.payment.update({
 where: { id: payment.id },
 data: { status: "FAILED", resultDescription: "Flutterwave is not configured on this store." },
 });
 await releaseInventoryForOrder(order.orderId);
 await updatePaymentStatus(order.orderId, "FAILED");
 await updateOrderStatus(order.orderId, "CANCELLED");
 return NextResponse.json(
 { ok: false, error: "Flutterwave is not configured on this store yet. Please contact the shop to arrange payment.", orderId: order.orderId, orderNumber: order.orderNumber, pollToken, configured: false, method: "FLUTTERWAVE" },
 { status: 501 }
 );
 }

 const txRef = `zed_${order.orderId}_${Date.now()}`;
 const charge = await initiateFlutterwaveCharge({
 tx_ref: txRef,
 amount: totals.total,
 currency: "KES",
 payment_options: "card,mpesa,ussd",
 email: parsed.data.email,
 first_name: parsed.data.name.split(" ")[0] ?? parsed.data.name,
 last_name: parsed.data.name.split(" ").slice(1).join(" ") ?? "",
 phone_number: phone,
 meta: {
 orderId: order.orderId,
 orderNumber: order.orderNumber,
 platform: "zed-gift-shop",
 },
 });

 if (charge.ok && charge.data) {
 await prisma.payment.update({
 where: { id: payment.id },
 data: { provider: "FLUTTERWAVE", txRef, checkoutUrl: charge.data.authorization_url, transactionCode: String(charge.data.id), status: "PENDING" },
 });
return NextResponse.json({
  ok: true,
  pollToken,
  orderId: order.orderId,
  orderNumber: order.orderNumber,
  total: totals.total,
  payment: {
  status: "PENDING",
  configured: true,
  method: "FLUTTERWAVE",
  txRef,
  authorizationUrl: charge.data.authorization_url,
  link: charge.data.link,
  },
  });
  }

await prisma.payment.update({
  where: { id: payment.id },
  data: { status: "FAILED", resultDescription: charge.error ?? null },
  });
  await releaseInventoryForOrder(order.orderId);
  await updatePaymentStatus(order.orderId, "FAILED");
  await updateOrderStatus(order.orderId, "CANCELLED");
  return NextResponse.json({
  ok: false,
  pollToken,
  orderId: order.orderId,
  orderNumber: order.orderNumber,
  total: totals.total,
  payment: { status: "FAILED", error: charge.error ?? "Flutterwave payment initiation failed.", configured: true, method: "FLUTTERWAVE" },
  }, { status: 502 });
  }

 return NextResponse.json({ error: "Invalid payment method." }, { status: 400 });
}
