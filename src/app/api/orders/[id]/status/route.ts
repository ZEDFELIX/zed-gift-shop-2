import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
 const { id } = await params;
 const order = await prisma.order.findUnique({
 where: { id },
 select: {
 orderNumber: true,
 orderStatus: true,
 paymentStatus: true,
 total: true,
 payments: { select: { mpesaReceipt: true, status: true, resultDescription: true }, orderBy: { createdAt: "desc" }, take: 1 },
 },
 });
 if (!order) {
 return NextResponse.json({ error: "Order not found." }, { status: 404 });
 }
 return NextResponse.json({
 orderNumber: order.orderNumber,
 orderStatus: order.orderStatus,
 paymentStatus: order.paymentStatus,
 total: order.total,
 mpesaReceipt: order.payments[0]?.mpesaReceipt ?? null,
 paymentResultDescription: order.payments[0]?.resultDescription ?? null,
 });
}