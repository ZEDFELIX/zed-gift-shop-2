import { NextResponse } from "next/server";
import { adjustStock } from "@/lib/data/inventory";
import { parsePagination, pageMeta, requirePermission, fail } from "@/lib/api";
import { listInventoryMovements, lowStockProducts } from "@/lib/data/admin";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
 productId: z.string().min(1),
 variantId: z.string().optional().or(z.literal("")),
 delta: z.number().int().min(-100000).max(100000),
 note: z.string().max(300).optional().or(z.literal("")),
});

export const runtime = "nodejs";

/** Paginated stock movement ledger + current low-stock list. */
export async function GET(req: Request) {
 try {
 await requirePermission("inventory.manage");
 } catch {
 return fail("You do not have permission to view inventory.", 403);
 }

 const url = new URL(req.url);
 const { page, pageSize } = parsePagination(url, { pageSize: 30 });
 const type = url.searchParams.get("type") ?? undefined;

 const [{ items, total }, lowStock] = await Promise.all([
   listInventoryMovements({ type, page, pageSize }),
   lowStockProducts(10),
 ]);

 return NextResponse.json({ data: items, meta: { ...pageMeta(page, pageSize, total), lowStock } });
}

export async function POST(req: Request) {
 let admin;
 try {
 admin = await requirePermission("inventory.manage");
 } catch {
 return fail("Unauthorized", 401);
 }

 let body: unknown;
 try {
 body = await req.json();
 } catch {
 return fail("Invalid request body.", 400);
 }
 const parsed = schema.safeParse(body);
 if (!parsed.success) {
 return fail(parsed.error.issues[0]?.message ?? "Please check the adjustment.", 400);
 }

 await adjustStock({
 productId: parsed.data.productId,
 variantId: parsed.data.variantId || null,
 type: parsed.data.delta >= 0 ? "IN" : "OUT",
 quantity: Math.abs(parsed.data.delta),
 note: parsed.data.note || "Manual admin adjustment",
 userId: admin.id,
 });

 const meta = await requestMeta();
 await writeAuditLog({
   ...meta,
   actorId: admin.id,
   actorEmail: admin.email,
   actorRole: admin.role,
   action: "inventory.adjusted",
   entity: "Product",
   entityId: parsed.data.productId,
   after: { delta: parsed.data.delta, variantId: parsed.data.variantId || null, note: parsed.data.note || null },
 });

 return NextResponse.json({ data: { ok: true } });
}
