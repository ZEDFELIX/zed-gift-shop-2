import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateOrderStatus } from "@/lib/data/orders";
import { sendOrderStatusUpdate } from "@/lib/email";
import { SITE, ORDER_STATUS_STEPS } from "@/lib/constants";
import { z } from "zod";

const schema = z.object({
 orderStatus: z.string().optional(),
 paymentStatus: z.string().optional(),
 mpesaReceipt: z.string().optional(),
});

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
 try {
 await requireAdmin();
 } catch {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const { orderId } = await params;
 const order = await prisma.order.findUnique({ where: { id: orderId } });
 if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

 let body: unknown;
 try {
 body = await req.json();
 } catch {
 return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
 }
 const parsed = schema.safeParse(body);
 if (!parsed.success) {
 return NextResponse.json({ error: "Please check the fields." }, { status: 400 });
 }

 const validOrderStatuses = ORDER_STATUS_STEPS.map((s) => s.status);
 const isOrderStatus = parsed.data.orderStatus && validOrderStatuses.includes(parsed.data.orderStatus);
 const isPaymentStatus =
 parsed.data.paymentStatus && ["PENDING", "SUCCESSFUL", "FAILED", "CANCELLED", "TIMEOUT"].includes(parsed.data.paymentStatus);

 const data: Record<string, string> = {};
 if (isOrderStatus) {
 data.orderStatus = parsed.data.orderStatus!;
 if (parsed.data.orderStatus !== "PENDING_PAYMENT" && order.orderStatus === "PENDING_PAYMENT" && order.paymentStatus !== "SUCCESSFUL") {
 data.paymentStatus = "CANCELLED";
 }
 }
 if (isPaymentStatus) data.paymentStatus = parsed.data.paymentStatus!;

 let updated = order;
 if (Object.keys(data).length > 0) {
 updated = await prisma.order.update({ where: { id: orderId }, data });
 }

 if (parsed.data.mpesaReceipt) {
 await prisma.payment.updateMany({
 where: { orderId },
 data: { mpesaReceipt: parsed.data.mpesaReceipt },
 });
 }

 // Notify the customer when the status moves forward.
 const steppedStatuses = ORDER_STATUS_STEPS.map((s) => s.status);
 const oldIndex = steppedStatuses.indexOf(order.orderStatus);
 const newIndex = steppedStatuses.indexOf(updated.orderStatus);
 if (newIndex > oldIndex) {
 await sendOrderStatusUpdate({
 to: updated.email,
 orderNumber: updated.orderNumber,
 status: ORDER_STATUS_STEPS[newIndex]?.label ?? updated.orderStatus,
 statusUrl: `${SITE.url}/track?order=${updated.orderNumber}`,
 });
 }

 return NextResponse.json({ order: updated });
}