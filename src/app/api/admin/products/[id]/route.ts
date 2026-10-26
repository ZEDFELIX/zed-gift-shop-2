import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requirePermission } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { notifyStockAlerts } from "@/lib/data/stock-alerts";
import { parsePersonalizationFieldsJson, productCreateSchema } from "@/lib/validations";

export const runtime = "nodejs";

async function guard() {
  try {
    return await requirePermission("products.manage");
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
  let personalizationFieldsJson: string | null = null;
  try {
    personalizationFieldsJson = parsePersonalizationFieldsJson((body as { personalizationFieldsJson?: unknown }).personalizationFieldsJson);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Check the personalization fields." }, { status: 400 });
  }
  const images = (Array.isArray((body as { images?: unknown }).images) ? (body as { images: string[] }).images : [])
    .map((u: string) => String(u).trim())
    .filter(Boolean)
    .slice(0, 3);

  const product = await prisma.$transaction(async (tx) => {
    if (d.variants?.length) await tx.productVariant.deleteMany({ where: { productId: id } });
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
        personalizationFieldsJson,
        giftWrapAvailable: d.giftWrapAvailable ?? false,
        giftMessageAvailable: d.giftMessageAvailable ?? true,
        publishedAt: d.status === "ACTIVE" && !existing.publishedAt ? new Date() : existing.publishedAt,
        images: images.length > 0
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

  if ((d.quantity ?? 0) > existing.quantity) await notifyStockAlerts(id).catch(() => undefined);
  return NextResponse.json({ product });
}

function getProductImageStoragePath(url: string, supabaseUrl: string): string | null {
  try {
    const parsed = new URL(url);
    const configured = new URL(supabaseUrl);
    if (parsed.origin !== configured.origin) return null;
    const prefix = "/storage/v1/object/public/product-images/";
    if (!parsed.pathname.startsWith(prefix)) return null;
    const path = decodeURIComponent(parsed.pathname.slice(prefix.length));
    return path && !path.split("/").some((part) => part === "." || part === "..") ? path : null;
  } catch {
    return null;
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await guard();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.product.findUnique({
    where: { id },
    include: { images: true },
  });
  if (!existing) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const assetUrls = [...existing.images.map((image) => image.url), ...(existing.videoUrl ? [existing.videoUrl] : [])];
  const storagePaths = supabaseUrl
    ? [...new Set(assetUrls.map((url) => getProductImageStoragePath(url, supabaseUrl)).filter((path): path is string => Boolean(path)))]
    : [];

  // If this product uses Supabase Storage files, require server credentials before
  // deleting the database record; otherwise a normal admin delete could orphan files.
  if (storagePaths.length > 0 && (!supabaseUrl || !serviceRoleKey)) {
    return NextResponse.json({
      error: "Product images are in Supabase Storage, but storage deletion is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before deleting this product.",
    }, { status: 503 });
  }

  // Do not remove an object still referenced by another product.
  const otherProductImages = storagePaths.length
    ? await prisma.productImage.findMany({
        where: { productId: { not: id }, url: { in: assetUrls } },
        select: { url: true },
      })
    : [];
  const otherProductsWithVideo = storagePaths.length
    ? await prisma.product.findMany({
        where: { id: { not: id }, videoUrl: { in: assetUrls } },
        select: { videoUrl: true },
      })
    : [];
  const sharedUrls = new Set([
    ...otherProductImages.map((image) => image.url),
    ...otherProductsWithVideo.map((product) => product.videoUrl).filter((url): url is string => Boolean(url)),
  ]);
  const pathsToDelete = storagePaths.filter((path) => {
    const matchingUrl = assetUrls.find((url) => getProductImageStoragePath(url, supabaseUrl!) === path);
    return matchingUrl && !sharedUrls.has(matchingUrl);
  });

  if (pathsToDelete.length > 0 && supabaseUrl && serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const { error } = await supabase.storage.from("product-images").remove(pathsToDelete);
    if (error) {
      return NextResponse.json({ error: "Could not delete the product's stored images. The product was not deleted; please try again." }, { status: 502 });
    }
  }

  // Hard-delete the product and dependent catalogue data. Order items keep their
  // historical name/price/image snapshot; product links become null by schema design.
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true, deletedStorageFiles: pathsToDelete.length });
}
