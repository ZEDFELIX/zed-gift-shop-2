import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { formatKES } from "@/lib/utils";
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
import { ORDER_STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics | Admin" };

const PRESETS = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "3m", label: "3 months" },
  { key: "12m", label: "12 months" },
];

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; from?: string; to?: string; bucket?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const preset = sp.preset ?? "30d";
  const bucket = (["day", "week", "month", "year"].includes(sp.bucket ?? "") ? sp.bucket : "day") as "day" | "week" | "month" | "year";
  const range = resolveRange(preset, sp.from, sp.to);

  const [metrics, statuses, series, best, worst, lowStock, customers, inventory] = await Promise.all([
    dashboardMetrics(),
    orderStatusBreakdown(),
    salesSeries(range, bucket),
    topProducts(range, 8, "best"),
    topProducts(range, 8, "worst"),
    lowStockProducts(8),
    customerAnalytics(range),
    inventoryAnalytics(),
  ]);

  const maxRevenue = Math.max(1, ...series.map((s) => s.revenue));
  const kpis = [
    { label: "Revenue (all time)", value: formatKES(metrics.totalSales) },
    { label: "Revenue in range", value: formatKES(series.reduce((s, r) => s + r.revenue, 0)) },
    { label: "To-day revenue", value: formatKES(metrics.todaysSales) },
    { label: "Orders", value: String(metrics.orders) },
    { label: "Pending orders", value: String(metrics.pendingOrders) },
    { label: "Customers", value: String(metrics.customers) },
    { label: "Average order value", value: formatKES(customers.aov) },
    { label: "Repeat customers", value: String(customers.returning) },
    { label: "Stock value", value: formatKES(inventory.stockValue) },
    { label: "Units available", value: String(inventory.unitsAvailable) },
    { label: "Low stock", value: String(metrics.lowStock) },
    { label: "Out of stock", value: String(metrics.outOfStock) },
  ];

  return (
    <div className="space-y-6">
      <form method="GET" className="flex flex-wrap items-center gap-2">
        <select name="preset" defaultValue={preset} className="field w-40">
          {PRESETS.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>
        <input type="date" name="from" defaultValue={sp.from ?? ""} className="field w-40" />
        <input type="date" name="to" defaultValue={sp.to ?? ""} className="field w-40" />
        <select name="bucket" defaultValue={bucket} className="field w-36">
          <option value="day">Daily</option>
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
          <option value="year">Yearly</option>
        </select>
        <button type="submit" className="rounded-zed border border-edge bg-white px-4 py-2.5 text-sm font-semibold text-[#07111F] hover:border-soft-sage">
          Apply
        </button>
      </form>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-zed border border-edge bg-white p-5">
            <p className="font-display text-2xl font-bold text-[#07111F]">{k.value}</p>
            <p className="text-sm text-[#334155]">{k.label}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-zed border border-edge bg-white p-6">
          <h2 className="font-display text-lg font-bold text-[#07111F]">Sales</h2>
          {series.length === 0 ? (
            <p className="mt-2 text-sm text-[#334155]">No paid orders in this range.</p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {series.map((s) => (
                <li key={s.bucket} className="flex items-center gap-3 text-sm">
                  <span className="w-24 shrink-0 text-xs text-[#334155]">
                    {new Date(s.bucket).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "2-digit" })}
                  </span>
                  <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-panel">
                    <span className="block h-full rounded-full bg-deep-olive" style={{ width: `${Math.round((s.revenue / maxRevenue) * 100)}%` }} />
                  </span>
                  <span className="w-24 shrink-0 text-right font-semibold text-[#07111F]">{formatKES(s.revenue)}</span>
                  <span className="w-10 shrink-0 text-right text-xs text-[#334155]">{s.orders}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-zed border border-edge bg-white p-6">
          <h2 className="font-display text-lg font-bold text-[#07111F]">Order status</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {statuses.map((s) => (
              <li key={s.status} className="flex items-center justify-between">
                <span className="text-[#334155]">{ORDER_STATUS_LABELS[s.status] ?? s.status}</span>
                <span className="font-bold text-[#07111F]">{s.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <TopList title="Best sellers" rows={best} />
        <TopList title="Slow movers" rows={worst} />
        <div className="rounded-zed border border-edge bg-white p-6">
          <h2 className="font-display text-lg font-bold text-[#07111F]">Low stock</h2>
          <ul className="mt-3 divide-y divide-edge text-sm">
            {lowStock.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2">
                <Link href={`/admin/products/${p.id}`} className="truncate pr-2 text-[#07111F] hover:text-soft-sage">
                  {p.name}
                </Link>
                <span className="font-bold text-red-600">{p.quantity} left</span>
              </li>
            ))}
            {lowStock.length === 0 && <li className="py-2 text-[#334155]">Nothing running low.</li>}
          </ul>
        </div>
      </section>
    </div>
  );
}

function TopList({ title, rows }: { title: string; rows: { productId: string; name: string; units: number; revenue: number }[] }) {
  return (
    <div className="rounded-zed border border-edge bg-white p-6">
      <h2 className="font-display text-lg font-bold text-[#07111F]">{title}</h2>
      <ul className="mt-3 divide-y divide-edge text-sm">
        {rows.map((r) => (
          <li key={r.productId} className="flex items-center justify-between py-2">
            <span className="truncate pr-2 text-[#07111F]">{r.name}</span>
            <span className="shrink-0 text-right">
              <span className="font-semibold text-[#07111F]">{r.units}</span>
              <span className="ml-2 text-xs text-[#334155]">{formatKES(r.revenue)}</span>
            </span>
          </li>
        ))}
        {rows.length === 0 && <li className="py-2 text-[#334155]">No sales yet.</li>}
      </ul>
    </div>
  );
}
