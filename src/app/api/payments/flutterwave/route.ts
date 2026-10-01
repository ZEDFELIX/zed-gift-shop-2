import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { initiateFlutterwaveCharge, verifyFlutterwaveTransaction } from "@/lib/flutterwave";

const schema = z.object({
  orderId: z.string().min(1).max(64),
  amount: z.number().positive().max(1_000_000),
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().min(9).max(15).optional(),
  currency: z.string().default("KES"),
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

 const { orderId } = parsed.data;

 // Verify the order exists and is unpaid
 const order = await prisma.order.findUnique({
 where: { id: orderId },
 select: {
 id: true,
 orderNumber: true,
 orderStatus: true,
 paymentStatus: true,
 total: true,
 phone: true,
 email: true,
 name: true,
 },
 });

 if (!order) {
 return NextResponse.json({ error: "Order not found." }, { status: 404 });
 }

 if (order.paymentStatus === "SUCCESSFUL") {
 return NextResponse.json({ error: "Order is already paid." }, { status: 409 });
 }

 const amount = order.total;
 const email = order.email;
 const phone = order.phone;
 const [firstName, ...restName] = order.name.trim().split(/\s+/);
 const lastName = restName.join(" ") || firstName;
 const currency = "KES";
 const txRef = `zed_${orderId}_${Date.now()}`;

 const result = await initiateFlutterwaveCharge({
 tx_ref: txRef,
 amount,
 currency: currency as string,
 payment_options: "card,mpesa,ussd",
 email,
 first_name: firstName,
 last_name: lastName,
 phone_number: phone,
 meta: {
 orderId,
 orderNumber: order.orderNumber,
 platform: "zed-gift-shop",
 },
 });

 if (!result.ok || !result.data) {
 return NextResponse.json(
 { ok: false, error: result.error ?? "Flutterwave payment initiation failed." },
 { status: 400 }
 );
 }

 // Create payment record
 await prisma.payment.create({
 data: {
 orderId,
 provider: "FLUTTERWAVE",
 status: "PENDING",
 amount,
 email,
 phone: phone ?? order.phone,
 txRef,
 checkoutUrl: result.data.authorization_url,
 transactionCode: String(result.data.id),
 },
 });

 return NextResponse.json({
 ok: true,
 txRef,
 authorizationUrl: result.data.authorization_url,
 link: result.data.link,
 orderNumber: order.orderNumber,
 amount,
 });
}
