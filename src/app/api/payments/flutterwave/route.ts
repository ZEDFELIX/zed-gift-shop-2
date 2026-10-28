import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { initiateFlutterwaveCharge } from "@/lib/flutterwave";
import { getSession } from "@/lib/auth";
import { verifyOrderToken } from "@/lib/order-token";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  orderId: z.string().min(1).max(64),
  pollToken: z.string().max(1024).optional(),
  amount: z.number().positive().max(1_000_000),
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().min(9).max(15).optional(),
  currency: z.string().default("KES"),
});

function clientKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: Request) {
 const limit = await rateLimit(`flutterwave-retry:${clientKey(req)}`, { limit: 6, windowSeconds: 300 });
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

 const { orderId, pollToken } = parsed.data;

 // Verify the order exists and is unpaid
 const order = await prisma.order.findUnique({
 where: { id: orderId },
 select: {
 id: true,
 orderNumber: true,
 userId: true,
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

 // Starting a charge requires the signed-in owner or the signed guest token
 // issued at checkout. Knowing an order ID alone must never trigger a charge.
 const session = await getSession();
 const ownsOrder = Boolean(session && order.userId && session.sub === order.userId);
 const hasGuestToken = verifyOrderToken(pollToken, order.id);
 if (!ownsOrder && !hasGuestToken) {
   return NextResponse.json({ error: "You are not allowed to pay for this order." }, { status: 403 });
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
