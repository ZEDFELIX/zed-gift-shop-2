import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request) {
 const { searchParams } = new URL(req.url);
 const q = (searchParams.get("q") ?? "").trim();
 if (!q) return NextResponse.json({ results: [] });

 const [results, categories] = await Promise.all([
 prisma.product.findMany({
 where: {
 status: "ACTIVE",
 OR: [
 { name: { contains: q, mode: "insensitive" } },
 { shortDescription: { contains: q, mode: "insensitive" } },
 { description: { contains: q, mode: "insensitive" } },
 { tags: { has: q } },
 ],
 },
 take: 6,
 orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
 select: {
 id: true,
 slug: true,
 name: true,
 price: true,
 images: { take: 1, select: { url: true } },
 categories: { take: 1, select: { category: { select: { name: true, slug: true } } } },
 },
 }),
 prisma.category.findMany({
 where: { kind: { in: ["OCCASION", "RECIPIENT", "CATEGORY"] }, name: { contains: q, mode: "insensitive" } },
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
 image: p.images[0]?.url ?? null,
 category: p.categories[0]?.category.name ?? null,
 categorySlug: p.categories[0]?.category.slug ?? null,
 })),
 categories: categories.map((c) => ({ name: c.name, slug: c.slug })),
 });
}