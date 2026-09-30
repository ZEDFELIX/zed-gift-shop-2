import { NextResponse } from "next/server";
import { cartLineSchema } from "@/lib/validations";
import { addToCart, getCartForApi } from "@/lib/cart";

export async function POST(req: Request) {
 let body: unknown;
 try {
 body = await req.json();
 } catch {
 return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
 }

 const parsed = cartLineSchema.safeParse(body);
 if (!parsed.success) {
 return NextResponse.json(
 { error: parsed.error.issues[0]?.message ?? "Invalid product selection." },
 { status: 400 },
 );
 }

 const result = await addToCart(parsed.data);
 if (!result.ok) {
 return NextResponse.json(
 { error: result.error ?? "Could not add to cart." },
 result.error?.toLowerCase().includes("unavailable") ? { status: 404 } : { status: 409 },
 );
 }
 return NextResponse.json({ ok: true, cart: await getCartForApi() });
}