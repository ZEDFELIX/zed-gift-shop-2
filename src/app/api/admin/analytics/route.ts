import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission, fail } from "@/lib/api";
import {
  dashboardMetrics,
  orderStatusBreakdown,
  salesSeries,
  topProducts,
  lowStockProducts,
  customerAnalytics,
  inventoryAnalytics,
  resolveRange,
} from "@/lib/data/admin";

export const runtime = "nodejs";

const querySchema = z.object({
  preset: z.enum(["today", "yesterday", "7d", "30d", "3m", "12m", "custom"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  bucket: z.enum(["day", "week", "month", "year"]).optional(),
});

export async function GET(req: Request) {
  try {
    await requirePermission("analytics.view");
  } catch {
    return fail("You do not have permission to view analytics.", 403);
  }

  const url = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return fail("Invalid query parameters.", 400);

  const range = resolveRange(parsed.data.preset, parsed.data.from, parsed.data.to);

  const [metrics, statuses, series, best, worst, lowStock, customers, inventory] = await Promise.all([
    dashboardMetrics(),
    orderStatusBreakdown(),
    salesSeries(range, parsed.data.bucket ?? "day"),
    topProducts(range, 8, "best"),
    topProducts(range, 8, "worst"),
    lowStockProducts(10),
    customerAnalytics(range),
    inventoryAnalytics(),
  ]);

  return NextResponse.json({
    data: {
      range: { from: range.from.toISOString(), to: range.to.toISOString(), preset: range.preset },
      metrics,
      orderStatus: statuses,
      sales: series,
      products: { best, worst, lowStock },
      customers,
      inventory,
    },
  });
}
