import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { queryStkStatus } from "@/lib/mpesa";
import { getSession } from "@/lib/auth";
import { verifyOrderToken } from "@/lib/order-token";

const schema = z.object({
  checkoutRequestId: z.string().min(1).max(200),
  orderId: z.string().min(1).max(64),
  pollToken: z.string().max(1024).optional(),
  phone: z.string().optional(),
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
 return NextResponse.json({ error: "Missing checkout request id." }, { status: 400 });
 }

 const payment = await prisma.payment.findFirst({
 where: { checkoutRequestId: parsed.data.checkoutRequestId },
 include: { order: { select: { id: true, userId: true, orderNumber: true, total: true } } },
 });
 if (!payment || payment.orderId !== parsed.data.orderId) {
 return NextResponse.json({ error: "Payment not found." }, { status: 404 });
 }

 // Payment identifiers alone are not authorization. Require the order owner
 // or the signed guest token issued during checkout before returning status.
 const session = await getSession();
 const ownsOrder = Boolean(session && payment.order.userId && session.sub === payment.order.userId);
 const hasGuestToken = verifyOrderToken(parsed.data.pollToken, payment.order.id);
 if (!ownsOrder && !hasGuestToken) {
   return NextResponse.json({ error: "Payment not found." }, { status: 404 });
 }

 // If our DB already has a final status, trust it.
 if (payment.status === "SUCCESSFUL") {
 return NextResponse.json({ status: "SUCCESSFUL", mpesaReceipt: payment.mpesaReceipt, orderNumber: payment.order.orderNumber, amount: payment.amount });
 }
 if (payment.status === "FAILED" || payment.status === "CANCELLED") {
 return NextResponse.json({ status: payment.status, orderNumber: payment.order.orderNumber, amount: payment.amount });
 }

 // Otherwise probe Daraja for the live result.
 const res = await queryStkStatus({ checkoutRequestId: parsed.data.checkoutRequestId, phone: parsed.data.phone });
 if (!res.ok) {
 return NextResponse.json({ status: "PENDING", error: res.error });
 }
 // The callback should arrive within seconds; if Daraja says success but we have
 // no receipt persisted yet, keep polling.
 const persisted = await prisma.payment.findFirst({
 where: { checkoutRequestId: parsed.data.checkoutRequestId },
 select: { status: true, mpesaReceipt: true },
 });
 if (persisted?.status === "SUCCESSFUL") {
 return NextResponse.json({ status: "SUCCESSFUL", mpesaReceipt: persisted.mpesaReceipt, orderNumber: payment.order.orderNumber, amount: payment.amount });
 }
 return NextResponse.json({ status: "PENDING", orderNumber: payment.order.orderNumber, amount: payment.amount });
}