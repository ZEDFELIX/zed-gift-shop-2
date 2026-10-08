import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatKES } from "@/lib/utils";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { AlertTriangle, ArrowRight, Boxes, CreditCard, Gift, Package, Receipt, Settings, Star, Truck, Users } from "lucide-react";

export const metadata = { title: "Admin dashboard" };

export default async function AdminDashboardPage() {
 const [
 orderCounts,
 recentOrders,
 productCounts,
 lowStockRaw,
 reviewCounts,
 revenueAgg,
 ] = await Promise.all([
 prisma.order.groupBy({ by: ["paymentStatus"], _count: { _all: true } }),
 prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { items: true, payments: { take: 1, orderBy: { createdAt: "desc" } } } }),
 prisma.product.groupBy({ by: ["status"], _count: { _all: true } }),
 prisma.product.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true, quantity: true, lowStockThreshold: true }, orderBy: { quantity: "asc" }, take: 6 }),
 prisma.review.groupBy({ by: ["status"], _count: { _all: true } }),
 prisma.order.aggregate({ where: { paymentStatus: "SUCCESSFUL" }, _sum: { total: true }, _count: true }),
 ]);

 const lowStock = lowStockRaw.filter((p) => p.quantity <= p.lowStockThreshold);

 const quickActions = [
  { href: "/admin/products/new", label: "Add product", icon: Gift },
  { href: "/admin/orders", label: "Manage orders", icon: Package },
  { href: "/admin/inventory", label: "Check inventory", icon: Boxes },
  { href: "/admin/coupons", label: "Manage coupons", icon: CreditCard },
  { href: "/admin/staff", label: "Manage staff", icon: Users },
  { href: "/admin/settings", label: "Store settings", icon: Settings },
 ];

 const paidOrders = orderCounts.find((o) => o.paymentStatus === "SUCCESSFUL")?._count._all ?? 0;
 const pendingOrders = orderCounts.find((o) => o.paymentStatus === "PENDING")?._count._all ?? 0;

 const cards = [
 { label: "Paid orders", value: paidOrders, icon: Package, tint: "bg-emerald-50 text-emerald-700" },
 { label: "Awaiting payment", value: pendingOrders, icon: Receipt, tint: "bg-amber-50 text-amber-700" },
 { label: "Revenue (paid)", value: formatKES(revenueAgg._sum.total ?? 0), icon: Truck, tint: "bg-warm-white text-deep-olive" },
 { label: "Active products", value: productCounts.find((p) => p.status === "ACTIVE")?._count._all ?? 0, icon: Package, tint: "bg-warm-white text-deep-olive" },
 ];

 return (
 <div className="space-y-6">
 <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
 {cards.map(({ label, value, icon: Icon, tint }) => (
 <div key={label} className="rounded-zed border border-edge bg-white p-5">
 <span className={`grid size-9 place-items-center rounded-zed ${tint}`}><Icon className="size-5" /></span>
 <p className="mt-3 font-display text-2xl font-bold text-[#07111F]">{value}</p>
 <p className="text-sm text-[#334155]">{label}</p>
 </div>
 ))}
 </section>

 <section className="rounded-zed border border-edge bg-white p-5">
  <div>
   <h2 className="font-display text-lg font-bold text-[#07111F]">Quick store controls</h2>
   <p className="text-sm text-[#334155]">Manage the shop without touching the code.</p>
  </div>
  <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
   {quickActions.map(({ href, label, icon: Icon }) => (
    <Link key={href} href={href} className="flex items-center gap-3 rounded-zed border border-edge bg-panel/50 p-3 text-sm font-semibold text-[#07111F] transition hover:border-soft-sage hover:bg-white">
     <span className="grid size-9 place-items-center rounded-zed bg-white text-soft-sage"><Icon className="size-4" /></span>
     {label}
     <ArrowRight className="ml-auto size-4 text-[#334155]" />
    </Link>
   ))}
  </div>
 </section>

 <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
 <div className="rounded-zed border border-edge bg-white p-6">
 <div className="flex items-center justify-between">
 <h2 className="font-display text-lg font-bold text-[#07111F]">Recent orders</h2>
 <Link href="/admin/orders" className="flex items-center gap-1 text-sm font-semibold text-soft-sage hover:underline">Manage <ArrowRight className="size-3.5" /></Link>
 </div>
 <ul className="mt-3 divide-y divide-edge text-sm">
 {recentOrders.map((o) => (
 <li key={o.id}>
 <Link href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-2 py-2.5 hover:text-soft-sage">
 <span className="font-semibold text-[#07111F]">{o.orderNumber}</span>
 <span className="hidden text-[#334155] sm:block">{o.name}</span>
 <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${o.paymentStatus === "SUCCESSFUL" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
 {PAYMENT_STATUS_LABELS[o.paymentStatus]}
 </span>
 <span className="font-bold text-[#07111F]">{formatKES(o.total)}</span>
 </Link>
 </li>
 ))}
 </ul>
 </div>

 <div className="space-y-6">
 <div className="rounded-zed border border-edge bg-white p-6">
 <h3 className="flex items-center gap-2 font-display text-base font-bold text-[#07111F]">
 <AlertTriangle className="size-4 text-amber-500" /> Low stock
 </h3>
 {lowStock.length === 0 ? (
 <p className="mt-2 text-sm text-[#334155]">All good - nothing running low.</p>
 ) : (
 <ul className="mt-2 divide-y divide-edge text-sm">
 {lowStock.map((p) => (
 <li key={p.id} className="flex items-center justify-between py-2">
 <span className="truncate pr-2 text-[#07111F]">{p.name}</span>
 <span className="font-bold text-red-600">{p.quantity} left</span>
 </li>
 ))}
 </ul>
 )}
 <Link href="/admin/inventory" className="mt-3 inline-block text-sm font-semibold text-soft-sage hover:underline">Open inventory</Link>
 </div>

 <div className="rounded-zed border border-edge bg-white p-6">
 <h3 className="flex items-center gap-2 font-display text-base font-bold text-[#07111F]">
 <Star className="size-4 text-soft-sage" /> Reviews
 </h3>
 <p className="mt-2 text-sm text-[#334155]">
 <span className="font-bold text-amber-600">{reviewCounts.find((r) => r.status === "PENDING")?._count._all ?? 0} pending</span> review(s) waiting for moderation.
 </p>
 <Link href="/admin/reviews" className="mt-3 inline-block text-sm font-semibold text-soft-sage hover:underline">Moderate reviews</Link>
 </div>
 </div>
 </section>
 </div>
 );
}