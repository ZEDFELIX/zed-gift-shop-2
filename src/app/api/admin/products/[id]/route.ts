import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { productCreateSchema } from "@/lib/validations";

export const runtime = "nodejs";

async function guard() {
 try {
 return await requireAdmin();
 } catch {
 return null;
 }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
 const admin = await guard();
 if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const { id } = await params;
 const existing = await prisma.product.findUnique({ where: { id }, include: { variants: true } });
 if (!existing) return NextResponse.json({ error: "Product not found." }, { status: 404 });

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

 const product = await prisma.$transaction(async (tx) => {
 if (d.variants?.length) {
 await tx.productVariant.deleteMany({ where: { productId: id } });
 }
 await tx.productCategory.deleteMany({ where: { productId: id } });
 await tx.productCollection.deleteMany({ where: { productId: id } });
 await tx.productImage.deleteMany({ where: { productId: id } });

 return tx.product.update({
 where: { id },
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
 publishedAt: d.status === "ACTIVE" && !existing.publishedAt ? new Date() : existing.publishedAt,
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
 });

 return NextResponse.json({ product });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
 const admin = await guard();
 if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const { id } = await params;
 const existing = await prisma.product.findUnique({ where: { id } });
 if (!existing) return NextResponse.json({ error: "Product not found." }, { status: 404 });

 await prisma.product.update({ where: { id }, data: { status: "ARCHIVED" } });
 return NextResponse.json({ ok: true });
}