import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { queryStkStatus } from "@/lib/mpesa";

const schema = z.object({ checkoutRequestId: z.string().min(1), phone: z.string().optional() });

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
 include: { order: { select: { orderNumber: true, total: true } } },
 });
 if (!payment) {
 return NextResponse.json({ error: "Payment not found." }, { status: 404 });
 }

 // If our DB already has a final status, trust it.
 if (payment.status === "SUCCESS") {
 return NextResponse.json({ status: "SUCCESS", mpesaReceipt: payment.mpesaReceipt, orderNumber: payment.order.orderNumber, amount: payment.amount });
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
 if (persisted?.status === "SUCCESS") {
 return NextResponse.json({ status: "SUCCESS", mpesaReceipt: persisted.mpesaReceipt, orderNumber: payment.order.orderNumber, amount: payment.amount });
 }
 return NextResponse.json({ status: "PENDING", orderNumber: payment.order.orderNumber, amount: payment.amount });
}