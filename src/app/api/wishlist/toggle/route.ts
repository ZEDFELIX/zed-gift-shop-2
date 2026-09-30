import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { toggleWishlist, addToWishlist } from "@/lib/wishlist";

const toggleSchema = z.object({ productId: z.string().min(1) });

export async function POST(req: Request) {
 let body: unknown;
 try {
 body = await req.json();
 } catch {
 return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
 }
 const parsed = toggleSchema.safeParse(body);
 if (!parsed.success) {
 return NextResponse.json({ error: "Missing product id." }, { status: 400 });
 }

 const user = await getSession();
 const userId = user?.sub ?? null;
 const result = await toggleWishlist(userId, parsed.data.productId);
 return NextResponse.json({ ok: true, ids: result.ids, inWishlist: result.inWishlist });
}

export async function PUT(req: Request) {
 let body: unknown;
 try {
 body = await req.json();
 } catch {
 return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
 }
 const parsed = toggleSchema.safeParse(body);
 if (!parsed.success) {
 return NextResponse.json({ error: "Missing product id." }, { status: 400 });
 }

 const user = await getSession();
 const userId = user?.sub ?? null;
 const ids = await addToWishlist(userId, parsed.data.productId);
 return NextResponse.json({ ok: true, ids });
}