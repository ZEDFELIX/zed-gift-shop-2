import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
const schema = z.object({ productId: z.string().min(1).max(128) });

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in to view saved gifts." }, { status: 401 });
  const wishlist = await prisma.wishlist.findUnique({
    where: { userId: user.id },
    include: {
      items: {
        orderBy: { createdAt: "desc" },
        include: {
          product: {
            select: {
              id: true, slug: true, name: true, price: true, compareAtPrice: true,
              status: true, quantity: true, reservedQuantity: true, trackInventory: true,
              images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, alt: true } },
            },
          },
        },
      },
    },
  });
  return NextResponse.json({
    items: (wishlist?.items ?? []).filter((item) => item.product.status === "ACTIVE").map((item) => ({
      id: item.id,
      productId: item.product.id,
      slug: item.product.slug,
      name: item.product.name,
      price: item.product.price,
      compareAtPrice: item.product.compareAtPrice,
      inStock: !item.product.trackInventory || item.product.quantity > item.product.reservedQuantity,
      image: item.product.images[0]?.url ?? null,
      imageAlt: item.product.images[0]?.alt ?? item.product.name,
      savedAt: item.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in to save gifts." }, { status: 401 });
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid gift." }, { status: 400 });
  const product = await prisma.product.findFirst({
    where: { id: parsed.data.productId, status: "ACTIVE" },
    select: { id: true },
  });
  if (!product) return NextResponse.json({ error: "This gift is no longer available." }, { status: 404 });

  const wishlist = await prisma.wishlist.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
    select: { id: true },
  });
  await prisma.wishlistItem.upsert({
    where: { wishlistId_productId: { wishlistId: wishlist.id, productId: product.id } },
    create: { wishlistId: wishlist.id, productId: product.id },
    update: {},
  });
  return NextResponse.json({ ok: true, saved: true });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in to manage saved gifts." }, { status: 401 });
  const url = new URL(req.url);
  const parsed = schema.safeParse({ productId: url.searchParams.get("productId") });
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid gift." }, { status: 400 });
  const wishlist = await prisma.wishlist.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (wishlist) {
    await prisma.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id, productId: parsed.data.productId } });
  }
  return NextResponse.json({ ok: true, saved: false });
}
