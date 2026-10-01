import "server-only";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyFlutterwaveTransaction, flutterwaveWebhookConfigured } from "@/lib/flutterwave";
import { confirmOrderPaid, updatePaymentStatus, updateOrderStatus, releaseInventoryForOrder } from "@/lib/data/orders";
import { sendOrderConfirmation } from "@/lib/email";
import { webhookSecretMatches } from "@/lib/mpesa";
import { SITE } from "@/lib/constants";

export const runtime = "nodejs";

export async function POST(req: Request) {
 let body: unknown;
 try {
 body = await req.json();
 } catch {
 return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
 }

 // Flutterwave webhook verification
 const signature = req.headers.get("flutterwave-signature");
 if (!flutterwaveWebhookConfigured() || !signature) {
 return NextResponse.json({ status: "error", message: "Webhook signature is not configured." }, { status: 401 });
 }
 // Verify the webhook signature before processing any payment state.
 const payload = JSON.stringify(body);
 const crypto = await import("crypto");
 const expected = crypto.createHmac("sha256", process.env.FLUTTERWAVE_ENCRYPTION_KEY ?? "")
  .update(payload)
  .digest("hex");
 const expectedBuffer = Buffer.from(expected, "utf8");
 const signatureBuffer = Buffer.from(signature, "utf8");
 if (
  expectedBuffer.length !== signatureBuffer.length ||
  !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
 ) {
  return NextResponse.json({ status: "error", message: "Invalid signature." }, { status: 401 });
 }

 const event = body as {
 id?: number;
 tx_ref?: string;
 event?: string;
 data?: {
 id: number;
 tx_ref: string;
 status: string;
 amount: number;
 currency: string;
 payment_type: string;
 channel: string;
 meta?: {
 orderId?: string;
 orderNumber?: string;
 };
 };
 };

 if (event.event !== "charge.completed" && event.event !== "charge.success") {
 return NextResponse.json({ status: "ignored" });
 }

 const txRef = event.data?.tx_ref;
 const transactionId = event.data?.id;
 if (!txRef || !transactionId) {
 return NextResponse.json({ status: "ignored" });
 }

 const payment = await prisma.payment.findFirst({
 where: { txRef },
 include: { order: { include: { items: true } } },
 });

 if (!payment) {
 return NextResponse.json({ status: "ignored" });
 }

 if (payment.status === "SUCCESSFUL" || payment.status === "FAILED") {
 return NextResponse.json({ status: "already_processed" });
 }

 // Verify with Flutterwave
 const verify = await verifyFlutterwaveTransaction(transactionId);
 const verified = verify.ok ? verify.data : null;
 const finalStatus =
  verified?.status === "successful" &&
  verified.tx_ref === payment.txRef &&
  verified.currency === "KES" &&
  Number(verified.amount) >= payment.amount
   ? "SUCCESSFUL"
   : verify.ok && ["failed", "cancelled"].includes(String(verified?.status).toLowerCase())
     ? "FAILED"
     : "PENDING";

 if (finalStatus === "SUCCESSFUL") {
 await prisma.payment.update({
 where: { id: payment.id },
 data: {
 status: "SUCCESSFUL",
 mpesaReceipt: `${txRef}-${transactionId}`,
 resultDescription: `Flutterwave payment via ${event.data?.payment_type ?? "card"}`,
 },
 });

 await confirmOrderPaid(payment.orderId, payment.id, `${txRef}-${transactionId}`);
 await sendOrderConfirmation({
 to: payment.order.email,
 orderNumber: payment.order.orderNumber,
 total: `KES ${payment.order.total.toLocaleString("en-KE")}`,
 items: payment.order.items.map((i) => ({
  name: i.name,
  qty: i.quantity,
  lineTotal: `KES ${(i.price * i.quantity + i.giftWrapPrice * i.quantity).toLocaleString("en-KE")}`,
 })),
 statusUrl: `${SITE.url}/track?order=${payment.order.orderNumber}`,
 });
} else if (finalStatus === "FAILED") {
 await prisma.payment.update({
  where: { id: payment.id },
  data: { status: "FAILED", resultDescription: `Flutterwave: ${finalStatus}` },
  });
  // Keep order-level payment status coherent so track/polling reflect reality.
  await updatePaymentStatus(payment.orderId, "FAILED");
  // Release the reserved stock so the items return to the shelf.
  await releaseInventoryForOrder(payment.orderId);
  await updateOrderStatus(payment.orderId, "CANCELLED");
 }

 return NextResponse.json({ status: "ok" });
}
