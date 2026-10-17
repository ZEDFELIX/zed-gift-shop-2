import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { escapeCsv } from "@/lib/csv";

export const runtime = "nodejs";

const HEADERS = [
 "name",
 "slug",
 "price",
 "compareAtPrice",
 "sku",
 "quantity",
 "lowStockThreshold",
 "status",
 "trackInventory",
 "tags",
 "shortDescription",
 "headline",
];

/** Download every product as a spreadsheet-friendly CSV. */
export async function GET() {
 try {
 await requirePermission("products.manage");
 } catch {
 return NextResponse.json({ error: "You do not have permission to export products." }, { status: 403 });
 }

 const products = await prisma.product.findMany({ orderBy: { name: "asc" } });

 const lines = [HEADERS.join(",")];
 for (const p of products) {
 lines.push(
 [
 p.name,
 p.slug,
 p.price,
 p.compareAtPrice ?? "",
 p.sku ?? "",
 p.quantity,
 p.lowStockThreshold,
 p.status,
 p.trackInventory ? "true" : "false",
 p.tags.join("; "),
 p.shortDescription ?? "",
 p.headline ?? "",
 ]
 .map(escapeCsv)
 .join(","),
 );
 }

 const csv = `\uFEFF${lines.join("\r\n")}`;
 return new NextResponse(csv, {
 headers: {
 "Content-Type": "text/csv; charset=utf-8",
 "Content-Disposition": 'attachment; filename="zed-products.csv"',
 },
 });
}
