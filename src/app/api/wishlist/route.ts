import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getWishlistProducts, getWishlistIds } from "@/lib/wishlist";

export const runtime = "nodejs";

/** Wishlist works for guests (cookie) and signed-in users (DB) alike. */
export async function GET() {
 const session = await getSession();
 const userId = session?.sub ?? null;
 const [products, ids] = await Promise.all([getWishlistProducts(userId), getWishlistIds(userId)]);
 return NextResponse.json({ data: products, ids });
}
