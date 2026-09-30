import { NextResponse } from "next/server";
import { couponSchema } from "@/lib/validations";
import { setCartCoupon, getCartForApi } from "@/lib/cart";

export async function POST(req: Request) {
 let body: unknown;
 try {
 body = await req.json();
 } catch {
 return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
 }

 const isNullPayload =
 body !== null && typeof body === "object" && "code" in body && (body as { code: string | null }).code == null;

 let code: string | null = null;
 if (!isNullPayload) {
 const parsed = couponSchema.safeParse(body);
 if (!parsed.success) {
 return NextResponse.json({ error: "Invalid coupon code." }, { status: 400 });
 }
 code = parsed.data.code;
 }

 await setCartCoupon(code);
 return NextResponse.json({ ok: true, cart: await getCartForApi() });
}