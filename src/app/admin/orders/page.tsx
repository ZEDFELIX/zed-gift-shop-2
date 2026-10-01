import Link from "next/link";
import { listOrdersAdmin } from "@/lib/data/orders";
import { formatKES } from "@/lib/utils";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orders | Admin" };

const PAYMENTS = ["ALL", "PENDING", "SUCCESSFUL", "FAILED", "CANCELLED"];

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; payment?: string; page?: string }> }) {
 const sp = await searchParams;
 const q = sp.q?.trim() ?? "";
 const status = sp.status ?? "";
 const payment = sp.payment ?? "ALL";
 const page = Number(sp.page ?? 1) || 1;
 const { items, total, pages, page: current } = await listOrdersAdmin({ q, status, payment, page });

 return (
 <div className="space-y-4">
 <form method="GET" className="flex flex-wrap items-center gap-2">
 <input name="q" defaultValue={q} placeholder="Order no., name, email, phone..." className="field w-72" />
 <select name="status" defaultValue={status} className="field w-44">
 <option value="">All statuses</option>
 {ORDER_STATUS_LABELS && Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
 <option key={k} value={k}>{v}</option>
 ))}
 </select>
 <select name="payment" defaultValue={payment} className="field w-40">
 {PAYMENTS.map((p) => <option key={p} value={p}>{p === "ALL" ? "All payments" : PAYMENT_STATUS_LABELS[p]}</option>)}
 </select>
 <button type="submit" className="rounded-zed border border-edge bg-white px-4 py-2.5 text-sm font-semibold text-[#07111F] hover:border-soft-sage">Filter</button>
 </form>

 <p className="text-sm text-[#334155]">{total} order{total === 1 ? "" : "s"}</p>

 <div className="overflow-x-auto rounded-zed border border-edge bg-white">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-edge bg-panel text-left text-xs uppercase tracking-wider text-[#334155]">
 <th className="p-3">Order</th>
 <th className="p-3">Customer</th>
 <th className="p-3">Total</th>
 <th className="p-3">Payment</th>
 <th className="p-3">Status</th>
 <th className="p-3">Placed</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-edge">
 {items.map((o) => (
 <tr key={o.id} className="hover:bg-panel/50">
 <td className="p-3">
 <Link href={`/admin/orders/${o.id}`} className="font-semibold text-soft-sage hover:underline">{o.orderNumber}</Link>
 </td>
 <td className="p-3">
 <p className="font-medium text-[#07111F]">{o.name}</p>
 <p className="text-xs text-[#334155]">{o.email}</p>
 </td>
 <td className="p-3 font-semibold text-[#07111F]">{formatKES(o.total)}</td>
 <td className="p-3">
 <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${o.paymentStatus === "SUCCESSFUL" ? "bg-emerald-50 text-emerald-700" : o.paymentStatus === "PENDING" ? "bg-amber-50 text-amber-700" : "bg-panel text-[#334155]"}`}>
 {PAYMENT_STATUS_LABELS[o.paymentStatus]}{o.payments[0]?.mpesaReceipt ? ` | ${o.payments[0].mpesaReceipt}` : ""}
 </span>
 </td>
 <td className="p-3 text-[#07111F]">{ORDER_STATUS_LABELS[o.orderStatus] ?? o.orderStatus}</td>
 <td className="p-3 text-xs text-[#334155]">{o.createdAt.toLocaleDateString("en-KE", { day: "numeric", month: "short" })}</td>
 </tr>
 ))}
 {items.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-[#334155]">No orders match.</td></tr>}
 </tbody>
 </table>
 </div>

 {pages > 1 && (
 <div className="flex items-center justify-center gap-2 text-sm">
 {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
 <Link key={n} href={`?page=${n}${q ? `&q=${encodeURIComponent(q)}` : ""}${status ? `&status=${status}` : ""}&payment=${payment}`}
 className={`rounded-zed px-3 py-1.5 font-semibold ${n === current ? "bg-zed-950 text-white" : "bg-panel text-[#334155]"}`}>
 {n}
 </Link>
 ))}
 </div>
 )}
 </div>
 );
}