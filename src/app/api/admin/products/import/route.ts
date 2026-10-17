import { NextResponse } from "next/server";
import type { ProductStatus } from "@prisma/client";
import { requirePermission } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { parseCsv } from "@/lib/csv";
import { notifyStockAlerts } from "@/lib/data/stock-alerts";
import { writeAuditLog, requestMeta } from "@/lib/audit";

export const runtime = "nodejs";

const STATUSES: ProductStatus[] = ["ACTIVE", "DRAFT", "ARCHIVED"];
const TRUTHY = new Set(["true", "1", "yes", "y"]);

function slugify(name: string, fallback: string): string {
 const slug = name
 .toLowerCase()
 .trim()
 .replace(/[^a-z0-9]+/g, "-")
 .replace(/^-+|-+$/g, "")
 .slice(0, 240);
 return slug || fallback;
}

type ImportResult = {
 created: number;
 updated: number;
 skipped: number;
 errors: { row: number; message: string }[];
};

/**
 * Bulk upsert products from CSV (name, slug, price are required; upsert is keyed
 * on slug). Each row is independent so one bad row never aborts the batch.
 */
export async function POST(req: Request) {
 let actor;
 try {
 actor = await requirePermission("products.manage");
 } catch {
 return NextResponse.json({ error: "You do not have permission to import products." }, { status: 403 });
 }

 let file: File | null = null;
 try {
 const form = await req.formData();
 const value = form.get("file");
 if (value instanceof File) file = value;
 } catch {
 return NextResponse.json({ error: "Send the CSV as multipart form data." }, { status: 400 });
 }
 if (!file || file.size === 0) {
 return NextResponse.json({ error: "Choose a CSV file first." }, { status: 400 });
 }
 if (file.size > 5 * 1024 * 1024) {
 return NextResponse.json({ error: "CSV must be 5 MB or smaller." }, { status: 400 });
 }

 const rows = parseCsv(await file.text());
 if (rows.length < 2) {
 return NextResponse.json({ error: "The CSV has no data rows." }, { status: 400 });
 }

 const headers = rows[0].map((h) => h.trim().toLowerCase());
 const col = (name: string) => headers.indexOf(name);
 for (const required of ["name", "slug", "price"]) {
 if (col(required) === -1) {
 return NextResponse.json({ error: `Missing required column: ${required}` }, { status: 400 });
 }
 }

 const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };
 const restock: string[] = [];

 for (let r = 1; r < rows.length; r++) {
 const cells = rows[r];
 const get = (name: string) => (col(name) === -1 ? "" : (cells[col(name)] ?? "").trim());
 const rowNo = r + 1;

 try {
 const name = get("name");
 if (!name) {
 result.skipped += 1;
 continue;
 }

 const price = Number(get("price"));
 if (!Number.isFinite(price) || price < 0) {
 result.errors.push({ row: rowNo, message: "Invalid price" });
 continue;
 }

 const slug = get("slug") ? slugify(get("slug"), `product-${rowNo}`) : slugify(name, `product-${rowNo}`);
 const statusRaw = get("status").toUpperCase();
 const status: ProductStatus = (STATUSES as string[]).includes(statusRaw) ? (statusRaw as ProductStatus) : "ACTIVE";
 const trackRaw = get("trackInventory");
 const trackInventory = trackRaw === "" ? true : TRUTHY.has(trackRaw.toLowerCase());
 const quantityRaw = get("quantity");
 const quantity = quantityRaw === "" ? 0 : Math.max(0, Math.round(Number(quantityRaw) || 0));
 const thresholdRaw = get("lowStockThreshold");
 const lowStockThreshold = thresholdRaw === "" ? 5 : Math.max(0, Math.round(Number(thresholdRaw) || 5));
 const compareRaw = get("compareAtPrice");
 const compareAtPrice =
 compareRaw === "" || !Number.isFinite(Number(compareRaw)) ? null : Math.max(0, Math.round(Number(compareRaw)));

 const data = {
 name,
 slug,
 price: Math.round(price),
 compareAtPrice,
 sku: get("sku") || null,
 shortDescription: get("shortDescription") || null,
 headline: get("headline") || null,
 tags: get("tags").split(";").map((t) => t.trim()).filter(Boolean).slice(0, 20),
 status,
 trackInventory,
 quantity,
 lowStockThreshold,
 };

 const existing = await prisma.product.findUnique({ where: { slug }, select: { id: true, quantity: true } });
 if (existing) {
 await prisma.product.update({ where: { id: existing.id }, data });
 if (quantity > existing.quantity) restock.push(existing.id);
 result.updated += 1;
 } else {
 await prisma.product.create({
 data: { ...data, publishedAt: status === "ACTIVE" ? new Date() : null },
 });
 result.created += 1;
 }
 } catch (error) {
 result.errors.push({ row: rowNo, message: error instanceof Error ? error.message : "Could not import row" });
 }
 }

 for (const productId of restock) {
 await notifyStockAlerts(productId).catch(() => undefined);
 }

 try {
 const meta = await requestMeta();
 await writeAuditLog({
 ...meta,
 actorId: actor.id,
 actorEmail: actor.email,
 actorRole: actor.role,
 action: "products.csv_import",
 entity: "Product",
 after: { created: result.created, updated: result.updated, skipped: result.skipped, errors: result.errors.length },
 });
 } catch {
 // Audit logging must never break an import.
 }

 return NextResponse.json({ ok: true, ...result });
}
