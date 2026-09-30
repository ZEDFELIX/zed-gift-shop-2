import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatKES } from "@/lib/utils";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { AlertTriangle, ArrowRight, Package, Receipt, Star, Truck } from "lucide-react";

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
 prisma.order.aggregate({ where: { paymentStatus: "SUCCESS" }, _sum: { total: true }, _count: true }),
 ]);

 const lowStock = lowStockRaw.filter((p) => p.quantity <= p.lowStockThreshold);

 const paidOrders = orderCounts.find((o) => o.paymentStatus === "SUCCESS")?._count._all ?? 0;
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
 <p className="mt-3 font-display text-2xl font-bold text-[#171717]">{value}</p>
 <p className="text-sm text-[#6B6B6B]">{label}</p>
 </div>
 ))}
 </section>

 <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
 <div className="rounded-zed border border-edge bg-white p-6">
 <div className="flex items-center justify-between">
 <h2 className="font-display text-lg font-bold text-[#171717]">Recent orders</h2>
 <Link href="/admin/orders" className="flex items-center gap-1 text-sm font-semibold text-soft-sage hover:underline">Manage <ArrowRight className="size-3.5" /></Link>
 </div>
 <ul className="mt-3 divide-y divide-edge text-sm">
 {recentOrders.map((o) => (
 <li key={o.id}>
 <Link href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-2 py-2.5 hover:text-soft-sage">
 <span className="font-semibold text-[#171717]">{o.orderNumber}</span>
 <span className="hidden text-[#6B6B6B] sm:block">{o.name}</span>
 <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${o.paymentStatus === "SUCCESS" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
 {PAYMENT_STATUS_LABELS[o.paymentStatus]}
 </span>
 <span className="font-bold text-[#171717]">{formatKES(o.total)}</span>
 </Link>
 </li>
 ))}
 </ul>
 </div>

 <div className="space-y-6">
 <div className="rounded-zed border border-edge bg-white p-6">
 <h3 className="flex items-center gap-2 font-display text-base font-bold text-[#171717]">
 <AlertTriangle className="size-4 text-amber-500" /> Low stock
 </h3>
 {lowStock.length === 0 ? (
 <p className="mt-2 text-sm text-[#6B6B6B]">All good - nothing running low.</p>
 ) : (
 <ul className="mt-2 divide-y divide-edge text-sm">
 {lowStock.map((p) => (
 <li key={p.id} className="flex items-center justify-between py-2">
 <span className="truncate pr-2 text-[#171717]">{p.name}</span>
 <span className="font-bold text-red-600">{p.quantity} left</span>
 </li>
 ))}
 </ul>
 )}
 <Link href="/admin/inventory" className="mt-3 inline-block text-sm font-semibold text-soft-sage hover:underline">Open inventory</Link>
 </div>

 <div className="rounded-zed border border-edge bg-white p-6">
 <h3 className="flex items-center gap-2 font-display text-base font-bold text-[#171717]">
 <Star className="size-4 text-soft-sage" /> Reviews
 </h3>
 <p className="mt-2 text-sm text-[#6B6B6B]">
 <span className="font-bold text-amber-600">{reviewCounts.find((r) => r.status === "PENDING")?._count._all ?? 0} pending</span> review(s) waiting for moderation.
 </p>
 <Link href="/admin/reviews" className="mt-3 inline-block text-sm font-semibold text-soft-sage hover:underline">Moderate reviews</Link>
 </div>
 </div>
 </section>
 </div>
 );
}