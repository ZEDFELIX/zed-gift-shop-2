import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request) {
 const { searchParams } = new URL(req.url);
 const q = (searchParams.get("q") ?? "").trim().slice(0, 100);
 if (!q) return NextResponse.json({ results: [], categories: [] });
 const terms = [...new Set(q.split(/\s+/).filter(Boolean))].slice(0, 5);

 const [results, categories] = await Promise.all([
 prisma.product.findMany({
 where: {
 status: "ACTIVE",
 AND: terms.map((term) => ({
  OR: [
   { name: { contains: term, mode: "insensitive" as const } },
   { shortDescription: { contains: term, mode: "insensitive" as const } },
   { description: { contains: term, mode: "insensitive" as const } },
   { tags: { has: term } },
  ],
 })),
 },
 take: 6,
 orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
 select: {
 id: true,
 slug: true,
 name: true,
 price: true,
 compareAtPrice: true,
 trackInventory: true,
 quantity: true,
 reservedQuantity: true,
 personalizationEnabled: true,
 images: { take: 1, select: { url: true } },
 categories: { take: 1, select: { category: { select: { name: true, slug: true } } } },
 },
 }),
 prisma.category.findMany({
 where: {
  kind: { in: ["OCCASION", "RECIPIENT", "CATEGORY"] },
  AND: terms.map((term) => ({ name: { contains: term, mode: "insensitive" as const } })),
 },
 take: 4,
 select: { name: true, slug: true, kind: true },
 }),
 ]);

 return NextResponse.json({
 results: results.map((p) => ({
 id: p.id,
 slug: p.slug,
 name: p.name,
 price: p.price,
 compareAtPrice: p.compareAtPrice,
 inStock: !p.trackInventory || p.quantity > p.reservedQuantity,
 personalizable: p.personalizationEnabled,
 image: p.images[0]?.url ?? null,
 category: p.categories[0]?.category.name ?? null,
 categorySlug: p.categories[0]?.category.slug ?? null,
 })),
 categories: categories.map((c) => ({ name: c.name, slug: c.slug })),
 });
}