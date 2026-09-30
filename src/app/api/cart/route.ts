import { NextResponse } from "next/server";
import { getCartForApi, clearCart } from "@/lib/cart";

export async function GET() {
 try {
 const cart = await getCartForApi();
 return NextResponse.json({ cart });
 } catch (err) {
 console.error("GET /api/cart", err);
 return NextResponse.json({ error: "Could not load the cart." }, { status: 500 });
 }
}

export async function DELETE() {
 try {
 await clearCart();
 return NextResponse.json({ ok: true, cart: await getCartForApi() });
 } catch (err) {
 console.error("DELETE /api/cart", err);
 return NextResponse.json({ error: "Could not clear the cart." }, { status: 500 });
 }
}