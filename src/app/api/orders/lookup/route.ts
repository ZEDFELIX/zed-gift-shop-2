import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrderByNumberAndKey } from "@/lib/data/orders";

const schema = z.object({
 orderNumber: z.string().min(3).max(24).transform((v) => v.trim().toUpperCase()),
 orderKey: z.string().min(3).max(254),
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
 return NextResponse.json({ error: "Enter the order number and the email or phone used at checkout." }, { status: 400 });
 }

 const order = await getOrderByNumberAndKey(parsed.data.orderNumber, parsed.data.orderKey);
 if (!order) {
 return NextResponse.json({ error: "No order matches those details. Double-check the order number and the email or phone you used." }, { status: 404 });
 }

 return NextResponse.json({
 orderNumber: order.orderNumber,
 orderStatus: order.orderStatus,
 paymentStatus: order.paymentStatus,
 createdAt: order.createdAt.toISOString(),
 total: order.total,
 county: order.county,
 town: order.town,
 deliveryMethod: order.deliveryMethod,
 isGift: order.isGift,
 email: order.email,
 items: order.items.map((i) => ({
 name: i.name,
 quantity: i.quantity,
 price: i.price,
 giftWrapPrice: i.giftWrapPrice,
 image: i.image,
 })),
 });
}