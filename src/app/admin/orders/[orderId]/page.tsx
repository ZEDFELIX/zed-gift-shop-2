import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getOrderById } from "@/lib/data/orders";
import { formatKES } from "@/lib/utils";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_LABELS as _ } from "@/lib/constants";
import { OrderStatusController } from "@/components/admin/OrderStatusController";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order | Admin", robots: { index: false } };

export default async function AdminOrderPage({ params }: { params: Promise<{ orderId: string }> }) {
 const { orderId } = await params;
 const order = await getOrderById(orderId);
 if (!order) notFound();

 const receipt = order.payments[0]?.mpesaReceipt;

 return (
 <div className="space-y-6">
 <Link href="/admin/orders" className="flex items-center gap-1 text-sm font-semibold text-[#6B6B6B] hover:text-soft-sage">
 <ArrowLeft className="size-4" /> All orders
 </Link>

 <div className="rounded-zed border border-edge bg-white p-6">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div>
 <p className="font-display text-xl font-bold text-[#171717]">{order.orderNumber}</p>
 <p className="text-sm text-[#6B6B6B]">{order.createdAt.toLocaleString("en-KE")}</p>
 </div>
 <div className="text-right">
 <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${order.paymentStatus === "SUCCESSFUL" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
 {PAYMENT_STATUS_LABELS[order.paymentStatus]}
 </span>
 <span className="ml-2 rounded-full bg-panel px-2.5 py-1 text-xs font-bold text-[#171717]">{ORDER_STATUS_LABELS[order.orderStatus]}</span>
 <p className="mt-1.5 font-display text-lg font-bold text-[#171717]">{formatKES(order.total)}</p>
 </div>
 </div>
 </div>

 <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
 <div className="space-y-6">
 <section className="rounded-zed border border-edge bg-white p-6">
 <h3 className="font-display text-base font-bold text-[#171717]">Items</h3>
 <ul className="mt-3 divide-y divide-edge">
 {order.items.map((i) => (
 <li key={i.id} className="flex items-center gap-3 py-3">
 <span className="relative block size-12 shrink-0 overflow-hidden rounded-zed glass-panel">
 {i.image && <Image src={i.image} alt="" fill unoptimized className="object-cover" />}
 </span>
 <div className="min-w-0 flex-1">
 <p className="font-medium text-[#171717]">{i.name}{i.sku ? <span className="ml-1 text-xs text-[#6B6B6B]">({i.sku})</span> : null}</p>
 <p className="text-xs text-[#6B6B6B]">Qty {i.quantity}{i.giftWrapPrice > 0 ? " | Gift wrap" : ""}</p>
 </div>
 <p className="font-semibold">{formatKES((i.price + i.giftWrapPrice) * i.quantity)}</p>
 </li>
 ))}
 </ul>
 </section>

 <section className="grid gap-4 sm:grid-cols-2">
 <div className="rounded-zed border border-edge bg-white p-5">
 <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B]">Customer</h4>
 <p className="mt-2 font-semibold text-[#171717]">{order.name}</p>
 <p className="text-sm text-[#6B6B6B]">{order.email}</p>
 <p className="text-sm text-[#6B6B6B]">{order.phone}</p>
 </div>
 <div className="rounded-zed border border-edge bg-white p-5">
 <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B]">Delivery</h4>
 <p className="mt-2 text-sm text-[#171717]">{order.address}{order.building ? `, ${order.building}` : ""}{order.apartment ? `, ${order.apartment}` : ""}</p>
 <p className="text-sm text-[#171717]">{order.town}, {order.county} | {order.deliveryMethod}</p>
 {order.isGift && <p className="mt-1.5 text-xs font-semibold text-soft-sage">Gift - hide prices on slip</p>}
 </div>
 </section>

 {order.payments.length > 0 && (
 <section className="rounded-zed border border-edge bg-white p-5">
 <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B]">Payments</h4>
 <ul className="mt-2 divide-y divide-edge text-sm">
 {order.payments.map((p) => (
 <li key={p.id} className="flex items-center justify-between gap-2 py-2">
 <div>
 <p className="font-medium text-[#171717]">M-PESA | {p.status}{p.mpesaReceipt ? ` | ${p.mpesaReceipt}` : ""}</p>
 {p.resultDescription && <p className="text-xs text-[#6B6B6B]">{p.resultDescription}</p>}
 </div>
 <p className="font-semibold">{formatKES(p.amount)}</p>
 </li>
 ))}
 </ul>
 </section>
 )}
 </div>

 <OrderStatusController
 orderId={order.id}
 orderStatus={order.orderStatus}
 paymentStatus={order.paymentStatus}
 receipt={receipt}
 />
 </div>
 </div>
 );
}