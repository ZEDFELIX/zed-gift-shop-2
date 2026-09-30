import { NextResponse } from "next/server";
import { listProducts } from "@/lib/data/products";

export async function GET(req: Request) {
 const url = new URL(req.url);
 const occasion = url.searchParams.get("occasion") ?? undefined;
 const recipient = url.searchParams.get("recipient") ?? undefined;
 const budget = url.searchParams.get("budget");
 const sort = url.searchParams.get("sort") ?? undefined;

 const filters = {
 occasion,
 recipient,
 max: budget ? Number(budget) : undefined,
 sort,
 pageSize: 24,
 };

 try {
 const result = await listProducts(filters);
 const items = result.items.map((p) => ({
 id: p.id,
 slug: p.slug,
 name: p.name,
 image: p.images[0]?.url ?? null,
 price: p.price,
 compareAtPrice: p.compareAtPrice,
 personalizationEnabled: p.personalizationEnabled,
 inStock: !p.trackInventory || p.quantity > p.reservedQuantity,
 }));
 return NextResponse.json({ items, total: result.total });
 } catch (err) {
 console.error("GET /api/gift-builder", err);
 return NextResponse.json({ error: "Could not load suggestions." }, { status: 500 });
 }
}