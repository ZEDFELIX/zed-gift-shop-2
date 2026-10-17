import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readCart } from "@/lib/cart";

export const runtime = "nodejs";

const select = {
 id: true,
 slug: true,
 name: true,
 price: true,
 compareAtPrice: true,
 tags: true,
 images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
} as const;

/**
 * A small set of complementary add-on gifts (greeting cards, wrap, small
 * extras) to "complete" the current cart. Anything already in the cart is
 * excluded so the same gift is never suggested twice.
 */
export async function GET() {
 const { cart } = await readCart();
 const inCart = new Set((cart?.items ?? []).map((i) => i.productId));
 const excluded = [...inCart];

 const preferred = await prisma.product.findMany({
 where: {
 status: "ACTIVE",
 id: { notIn: excluded },
 OR: [{ tags: { has: "card" } }, { tags: { has: "gift" } }, { slug: { contains: "card" } }],
 },
 select,
 take: 3,
 });

 const remaining = 3 - preferred.length;
 const fillers = remaining > 0
 ? await prisma.product.findMany({
 where: { status: "ACTIVE", id: { notIn: [...excluded, ...preferred.map((p) => p.id)] } },
 select,
 orderBy: [{ bestSeller: "desc" }, { featured: "desc" }],
 take: remaining,
 })
 : [];

 return NextResponse.json({ products: [...preferred, ...fillers] });
}
