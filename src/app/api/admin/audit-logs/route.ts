import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission, parsePagination, pageMeta, fail } from "@/lib/api";
import { listAuditLogs } from "@/lib/data/admin";

export const runtime = "nodejs";

const querySchema = z.object({
  q: z.string().trim().max(120).optional(),
  action: z.string().trim().max(60).optional(),
  entity: z.string().trim().max(60).optional(),
});

export async function GET(req: Request) {
  try {
    await requirePermission("audit.view");
  } catch {
    return fail("You do not have permission to view audit logs.", 403);
  }

  const url = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return fail("Invalid query parameters.", 400);

  const { page, pageSize } = parsePagination(url, { pageSize: 30 });
  const { items, total } = await listAuditLogs({
    q: parsed.data.q,
    action: parsed.data.action,
    entity: parsed.data.entity,
    page,
    pageSize,
  });

  return NextResponse.json({ data: items, meta: pageMeta(page, pageSize, total) });
}
