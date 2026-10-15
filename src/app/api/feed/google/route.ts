import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Google Merchant Center product feed (readiness version).
 *
 * - Only ACTIVE products with a name, price and image are listed.
 * - Prices and availability mirror the live catalogue on every request.
 * - No GTIN/brand is invented: most items are personalized or custom-made, so
 *   identifier_exists is set to "no" per Google's custom-goods handling.
 * - This feed is NOT approved or submitted anywhere - connect it manually in
 *   Merchant Center after review.
 */
export async function GET() {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      shortDescription: true,
      description: true,
      headline: true,
      price: true,
      slug: true,
      quantity: true,
      trackInventory: true,
      images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  const items = products
    .filter((p) => p.name.trim() && p.price > 0 && p.images[0]?.url)
    .map((p) => {
      const inStock = !p.trackInventory || p.quantity > 0;
      const description = (p.shortDescription || p.description || p.headline || p.name).trim().slice(0, 1000);
      return [
        "    <item>",
        `      <g:id>${esc(p.id)}</g:id>`,
        `      <title>${esc(p.name.trim().slice(0, 150))}</title>`,
        `      <description>${esc(description)}</description>`,
        `      <link>${esc(`${SITE.url}/product/${p.slug}`)}</link>`,
        `      <g:image_link>${esc(p.images[0]!.url)}</g:image_link>`,
        `      <g:price>${p.price} KES</g:price>`,
        `      <g:availability>${inStock ? "in_stock" : "out_of_stock"}</g:availability>`,
        `      <g:condition>new</g:condition>`,
        `      <g:identifier_exists>no</g:identifier_exists>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    "  <channel>",
    `    <title>${esc(SITE.name)}</title>`,
    `    <link>${esc(SITE.url)}</link>`,
    `    <description>${esc(SITE.description)}</description>`,
    items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
