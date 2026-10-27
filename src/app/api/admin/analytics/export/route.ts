import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { escapeCsv } from "@/lib/csv";
import { customerAnalytics, resolveRange, salesSeries, topProducts } from "@/lib/data/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRESETS = new Set(["today", "yesterday", "7d", "30d", "3m", "12m", "custom"]);
const BUCKETS = new Set(["day", "week", "month", "year"]);

export async function GET(request: NextRequest) {
  const me = await getCurrentUser().catch(() => null);
  if (me?.role !== "ADMIN") {
    return NextResponse.json({ error: "Only an administrator can export business reports." }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const requestedPreset = params.get("preset") ?? "30d";
  const preset = PRESETS.has(requestedPreset) ? requestedPreset : "30d";
  const requestedBucket = params.get("bucket") ?? "day";
  const bucket = BUCKETS.has(requestedBucket) ? requestedBucket as "day" | "week" | "month" | "year" : "day";
  const range = resolveRange(preset, params.get("from") ?? undefined, params.get("to") ?? undefined);

  if (!Number.isFinite(range.from.getTime()) || !Number.isFinite(range.to.getTime()) || range.from > range.to) {
    return NextResponse.json({ error: "Invalid report date range." }, { status: 400 });
  }

  const [series, best, customers] = await Promise.all([
    salesSeries(range, bucket),
    topProducts(range, 50, "best"),
    customerAnalytics(range),
  ]);

  const rows: (string | number)[][] = [
    ["Report section", "Period / Product", "Revenue (KES)", "Paid orders / Units", "Notes"],
    ["Summary", "Selected range", series.reduce((sum, item) => sum + item.revenue, 0), series.reduce((sum, item) => sum + item.orders, 0), "Revenue includes successful payments only"],
    ["Summary", "Average order value (KES)", customers.aov, "", "Calculated from successful orders in selected range"],
    ["Summary", "New customers", customers.newCustomers, "", "Customer accounts created in selected range"],
    ["Summary", "Repeat customers", customers.returning, "", "Customers with more than one successful order in selected range"],
    ["", "", "", "", ""],
    ["Sales trend", "Bucket", "Revenue (KES)", "Paid orders", ""],
    ...series.map((item) => ["Sales trend", item.bucket, item.revenue, item.orders, bucket]),
    ["", "", "", "", ""],
    ["Best sellers", "Product", "Revenue (KES)", "Units sold", "Ranked by units sold"],
    ...best.map((item, index) => ["Best sellers", item.name, item.revenue, item.units, index + 1]),
  ];

  const csv = "\uFEFF" + rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="zed-business-report.csv"',
      "Cache-Control": "no-store",
    },
  });
}
