import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission, parsePagination, pageMeta, fail } from "@/lib/api";
import { listPaymentsAdmin } from "@/lib/data/admin";

export const runtime = "nodejs";

const querySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.enum(["ALL", "PENDING", "PROCESSING", "SUCCESSFUL", "FAILED", "CANCELLED", "TIMEOUT", "REFUNDED", "REVERSED"]).optional(),
  provider: z.enum(["ALL", "M_PESA", "FLUTTERWAVE", "BANK_TRANSFER", "COD"]).optional(),
});

export async function GET(req: Request) {
  try {
    await requirePermission("payments.view");
  } catch {
    return fail("You do not have permission to view payments.", 403);
  }

  const url = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return fail("Invalid query parameters.", 400);

  const { page, pageSize } = parsePagination(url, { pageSize: 25 });
  const { items, total, sums } = await listPaymentsAdmin({
    q: parsed.data.q,
    status: parsed.data.status,
    provider: parsed.data.provider,
    page,
    pageSize,
  });

  return NextResponse.json({
    data: items,
    meta: {
      ...pageMeta(page, pageSize, total),
      summary: sums.map((s) => ({
        status: s.status,
        count: typeof s._count === "object" ? (s._count?._all ?? 0) : (s._count ?? 0),
        amount: s._sum?.amount ?? 0,
      })),
    },
  });
}
