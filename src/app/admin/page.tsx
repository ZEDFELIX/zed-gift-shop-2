import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/audit";
import { formatKES } from "@/lib/utils";
import { PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { AlertTriangle, ArrowRight, Boxes, CreditCard, Gift, Package, Receipt, Ribbon, Settings, Star, Users, Activity, BarChart3, UserRound, Clock3 } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin dashboard" };

export default async function AdminDashboardPage() {
  const me = await getCurrentUser().catch(() => null);
  const isAdmin = me?.role === "ADMIN";
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [paymentCounts, orderStatusCounts, recentOrders, productCounts, trackedProducts, customerCount, recentCustomers, revenueAgg, recentPaidOrders, recentActivity, reviewCounts] = await Promise.all([
    prisma.order.groupBy({ by: ["paymentStatus"], _count: { _all: true } }),
    prisma.order.groupBy({ by: ["orderStatus"], _count: { _all: true } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 7, include: { items: true, payments: { take: 1, orderBy: { createdAt: "desc" } } } }),
    prisma.product.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.product.findMany({ where: { status: "ACTIVE", trackInventory: true }, select: { id: true, name: true, quantity: true, reservedQuantity: true, lowStockThreshold: true }, orderBy: { quantity: "asc" } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.findMany({ where: { role: "CUSTOMER" }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, name: true, email: true, createdAt: true } }),
    prisma.order.aggregate({ where: { paymentStatus: "SUCCESSFUL" }, _sum: { total: true }, _count: true }),
    prisma.order.findMany({ where: { paymentStatus: "SUCCESSFUL", createdAt: { gte: sevenDaysAgo } }, select: { total: true, createdAt: true } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, action: true, entity: true, actorEmail: true, createdAt: true } }),
    prisma.review.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const lowStock = trackedProducts.filter((p) => p.quantity - p.reservedQuantity <= p.lowStockThreshold);
  const totalProducts = productCounts.reduce((sum, p) => sum + p._count._all, 0);
  const paidOrders = paymentCounts.find((o) => o.paymentStatus === "SUCCESSFUL")?._count._all ?? 0;
  const pendingOrders = paymentCounts.find((o) => o.paymentStatus === "PENDING")?._count._all ?? 0;
  const cancelledOrders = orderStatusCounts.find((o) => o.orderStatus === "CANCELLED")?._count._all ?? 0;
  const pendingReviews = reviewCounts.find((r) => r.status === "PENDING")?._count._all ?? 0;
  const cards = [
    { label: "Total revenue", value: formatKES(revenueAgg._sum.total ?? 0), icon: CreditCard, hint: "Confirmed payments", private: true },
    { label: "Total orders", value: String(orderStatusCounts.reduce((sum, o) => sum + o._count._all, 0)), icon: Receipt, hint: "All order records" },
    { label: "Total products", value: String(totalProducts), icon: Gift, hint: "Across all product statuses" },
    { label: "Total customers", value: String(customerCount), icon: Users, hint: "Registered customer accounts" },
    { label: "Pending payments", value: String(pendingOrders), icon: Clock3, hint: "Awaiting payment confirmation" },
    { label: "Paid orders", value: String(paidOrders), icon: Package, hint: "Successful payment records" },
    { label: "Low stock", value: String(lowStock.length), icon: Boxes, hint: "At or below stock threshold" },
    { label: "Cancelled orders", value: String(cancelledOrders), icon: Activity, hint: "Cancelled order records" },
  ];
  const quickActions = [
    ...(isAdmin ? [{ href: "/admin/products/new", label: "Add product", icon: Gift }] : []),
    { href: "/admin/orders", label: "Manage orders", icon: Package },
    { href: "/admin/inventory", label: "Check inventory", icon: Boxes },
    ...(isAdmin ? [
      { href: "/admin/coupons", label: "Manage coupons", icon: CreditCard },
      { href: "/admin/gift-wrap", label: "Gift wrapping", icon: Ribbon },
    ] : []),
    ...(can(me?.role, "staff.manage") ? [{ href: "/admin/staff", label: "Manage staff", icon: Users }] : []),
    ...(can(me?.role, "settings.manage") ? [{ href: "/admin/settings", label: "Store settings", icon: Settings }] : []),
  ];

  const daily = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(sevenDaysAgo);
    day.setDate(day.getDate() + index);
    const key = day.toLocaleDateString("en-CA");
    const value = recentPaidOrders.filter((o) => o.createdAt.toLocaleDateString("en-CA") === key).reduce((sum, o) => sum + o.total, 0);
    return { key, label: day.toLocaleDateString("en-KE", { weekday: "short" }), value };
  });
  const maxDaily = Math.max(1, ...daily.map((d) => d.value));

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.filter((c) => isAdmin || !c.private).map(({ label, value, icon: Icon, hint }) => (
          <article key={label} className="zed-admin-stat-card min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold text-slate-500 sm:text-xs">{label}</p>
              <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600"><Icon className="size-4" /></span>
            </div>
            <p className="mt-3 break-words font-display text-xl font-bold tracking-tight text-slate-950 sm:text-[25px]">{value}</p>
            <p className="mt-1 text-[10px] leading-4 text-slate-400 sm:text-[11px]">{hint}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-bold text-slate-950">Quick actions</h2>
            <p className="mt-0.5 text-xs text-slate-500">Shortcuts to everyday store operations</p>
          </div>
          <Link href="/admin/analytics" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-950">View reports <ArrowRight className="size-3.5" /></Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          {quickActions.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="group flex min-h-[76px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white hover:shadow-sm">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-slate-600 shadow-sm"><Icon className="size-4" /></span>
              <span className="min-w-0">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,.85fr)]">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div><h2 className="font-display text-base font-bold text-slate-950">Paid sales · last 7 days</h2><p className="mt-0.5 text-xs text-slate-500">Daily totals from successful payments</p></div>
            <BarChart3 className="size-5 text-slate-400" />
          </div>
          <div className="mt-5 flex h-36 items-end gap-2 sm:gap-3">
            {daily.map((d) => (
              <div key={d.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                <div className="flex h-full w-full items-end overflow-hidden rounded-t-md bg-slate-100">
                  <div title={formatKES(d.value)} className="w-full rounded-t-md bg-slate-800 transition-all" style={{ height: `${d.value ? Math.max(5, d.value / maxDaily * 100) : 0}%` }} />
                </div>
                <span className="text-[10px] font-medium text-slate-400">{d.label}</span>
              </div>
            ))}
          </div>
          <Link href="/admin/analytics" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-950">Open analytics <ArrowRight className="size-3.5" /></Link>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2"><h2 className="font-display text-base font-bold text-slate-950">Inventory alerts</h2><AlertTriangle className="size-4 text-amber-500" /></div>
          {lowStock.length === 0 ? <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-3 text-xs text-emerald-800">No products are currently at or below their stock threshold.</p> : (
            <ul className="mt-3 divide-y divide-slate-100">
              {lowStock.slice(0, 6).map((p) => <li key={p.id} className="flex items-center justify-between gap-3 py-2"><Link href={`/admin/products/${p.id}`} className="min-w-0 truncate text-xs font-medium text-slate-700 hover:underline">{p.name}</Link><span className="shrink-0 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">{Math.max(0, p.quantity - p.reservedQuantity)} left</span></li>)}
            </ul>
          )}
          <Link href="/admin/inventory" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-950">Open inventory <ArrowRight className="size-3.5" /></Link>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(260px,.75fr)]">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2"><h2 className="font-display text-base font-bold text-slate-950">Recent orders</h2><Link href="/admin/orders" className="text-xs font-semibold text-slate-600 hover:text-slate-950">All orders →</Link></div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-xs">
              <thead><tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-2 pr-3">Order</th><th className="py-2 pr-3">Customer</th><th className="py-2 pr-3">Payment</th><th className="py-2 text-right">Total</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((o) => <tr key={o.id}><td className="py-3 pr-3"><Link href={`/admin/orders/${o.id}`} className="font-semibold text-slate-800 hover:underline">{o.orderNumber}</Link><p className="mt-0.5 text-[10px] text-slate-400">{o.createdAt.toLocaleDateString("en-KE")}</p></td><td className="py-3 pr-3"><span className="block max-w-36 truncate font-medium text-slate-700">{o.name}</span></td><td className="py-3 pr-3"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${o.paymentStatus === "SUCCESSFUL" ? "bg-emerald-50 text-emerald-700" : o.paymentStatus === "PENDING" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{PAYMENT_STATUS_LABELS[o.paymentStatus]}</span></td><td className="py-3 text-right font-bold text-slate-800">{formatKES(o.total)}</td></tr>)}
                {recentOrders.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-slate-400">No orders yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between"><h2 className="font-display text-base font-bold text-slate-950">New customers</h2><UserRound className="size-4 text-slate-400" /></div>
            <ul className="mt-2 divide-y divide-slate-100">
              {recentCustomers.map((c) => <li key={c.id} className="flex items-center gap-3 py-2"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{c.name.slice(0,1).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-slate-700">{c.name}</span><span className="block truncate text-[10px] text-slate-400">{c.email}</span></span></li>)}
              {recentCustomers.length === 0 && <li className="py-4 text-xs text-slate-400">No customer registrations yet.</li>}
            </ul>
            <Link href="/admin/customers" className="mt-2 inline-flex text-xs font-semibold text-slate-600 hover:text-slate-950">View customers →</Link>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between"><h2 className="font-display text-base font-bold text-slate-950">Admin activity</h2><Activity className="size-4 text-slate-400" /></div>
            <ul className="mt-2 space-y-3">
              {recentActivity.map((a) => <li key={a.id} className="border-l-2 border-slate-200 pl-3"><p className="text-xs font-semibold text-slate-700">{a.action} · {a.entity}</p><p className="mt-0.5 text-[10px] text-slate-400">{a.actorEmail ?? "System"} · {a.createdAt.toLocaleString("en-KE", { dateStyle: "short", timeStyle: "short" })}</p></li>)}
              {recentActivity.length === 0 && <li className="text-xs text-slate-400">No administrative actions recorded yet.</li>}
            </ul>
            {isAdmin && <Link href="/admin/audit-logs" className="mt-3 inline-flex text-xs font-semibold text-slate-600 hover:text-slate-950">View audit log →</Link>}
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between"><h2 className="font-display text-sm font-bold text-slate-950">Reviews to moderate</h2><Star className="size-4 text-slate-400" /></div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{pendingReviews}</p>
            <Link href="/admin/reviews" className="mt-1 inline-flex text-xs font-semibold text-slate-600 hover:text-slate-950">Review submissions →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
