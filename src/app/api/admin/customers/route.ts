import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission, parsePagination, pageMeta, fail } from "@/lib/api";
import { listCustomersAdmin } from "@/lib/data/admin";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const querySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.enum(["ALL", "ACTIVE", "SUSPENDED", "DISABLED"]).optional(),
});

export async function GET(req: Request) {
  try {
    await requirePermission("customers.view");
  } catch {
    return fail("You do not have permission to view customers.", 403);
  }

  const url = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return fail("Invalid query parameters.", 400);

  const { page, pageSize } = parsePagination(url, { pageSize: 25 });
  try {
    const { items, total } = await listCustomersAdmin({
      q: parsed.data.q,
      status: parsed.data.status,
      page,
      pageSize,
    });
    return NextResponse.json({ data: items, meta: pageMeta(page, pageSize, total) });
  } catch (error) {
    logger.error("admin.customers.list_failed", { error: error instanceof Error ? error.message : String(error) });
    return fail("Could not load customers.", 500);
  }
}
