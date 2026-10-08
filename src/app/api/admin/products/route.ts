import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { productCreateSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(req: Request) {
 try {
 await requireAdmin();
 } catch {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 let body: unknown;
 try {
 body = await req.json();
 } catch {
 return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
 }

 const parsed = productCreateSchema.safeParse(body);
 if (!parsed.success) {
 return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the form." }, { status: 400 });
 }
 const d = parsed.data;
 const images = (Array.isArray((body as { images?: unknown }).images) ? (body as { images: string[] }).images : [])
 .map((u: string) => String(u).trim())
 .filter(Boolean)
 .slice(0, 3);

 if (d.slug) {
 const clash = await prisma.product.findUnique({ where: { slug: d.slug } });
 if (clash) return NextResponse.json({ error: "That slug is already in use." }, { status: 409 });
 }

 const product = await prisma.product.create({
 data: {
 name: d.name,
videoUrl: d.videoUrl || null,
slug: d.slug,
 headline: d.headline || null,
 shortDescription: d.shortDescription || null,
 description: d.description || null,
 price: d.price,
 compareAtPrice: d.compareAtPrice,
 sku: d.sku || null,
 tags: d.tags ?? [],
 status: d.status,
 featured: d.featured ?? false,
 bestSeller: d.bestSeller ?? false,
 trackInventory: d.trackInventory,
 quantity: d.quantity ?? 0,
 lowStockThreshold: d.lowStockThreshold ?? 5,
 personalizationEnabled: d.personalizationEnabled ?? false,
 giftWrapAvailable: d.giftWrapAvailable ?? false,
 giftMessageAvailable: d.giftMessageAvailable ?? true,
 publishedAt: d.status === "ACTIVE" ? new Date() : null,
 images:
 images.length > 0
 ? { create: images.map((url: string, i: number) => ({ url, isPrimary: i === 0, sortOrder: i })) }
 : undefined,
 categories: d.categoryIds?.length
 ? { create: d.categoryIds.map((cid: string, i: number) => ({ categoryId: cid, sortOrder: i })) }
 : undefined,
 collections: d.collectionIds?.length
 ? { create: d.collectionIds.map((cid: string, i: number) => ({ collectionId: cid, sortOrder: i })) }
 : undefined,
 variants: d.variants?.length
 ? { create: d.variants.map((v) => ({ name: v.name, value: v.value, sku: v.sku, priceOffset: v.priceOffset, quantity: v.quantity, active: v.active })) }
 : undefined,
 },
 });

 return NextResponse.json({ product }, { status: 201 });
}