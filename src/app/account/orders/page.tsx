import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getOrdersForUser } from "@/lib/data/orders";
import { formatKES } from "@/lib/utils";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";

export const metadata = { title: "My orders" };

export default async function AccountOrdersPage() {
 const user = (await getCurrentUser())!;
 const orders = await getOrdersForUser(user.id);

 if (orders.length === 0) {
 return (
 <div className="glass-card rounded-zed p-10 text-center">
 <p className="font-display text-xl font-bold text-[#171717]">No orders yet</p>
 <p className="mt-1 text-sm text-[#6B6B6B]">Your past orders and their status will show up here.</p>
 <Link href="/shop" className="mt-5 inline-block rounded-zed bg-zed-950 px-6 py-3 text-sm font-bold text-white">Browse gifts</Link>
 </div>
 );
 }

 return (
 <div className="space-y-4">
 {orders.map((o) => {
 const receipt = o.payments[0]?.mpesaReceipt;
 return (
 <Link key={o.id} href={`/account/orders/${o.id}`} className="glass-card block rounded-zed p-5 transition-all hover:-translate-y-1 hover:shadow-glass-lg">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div>
 <p className="font-bold text-[#171717]">{o.orderNumber}</p>
 <p className="text-sm text-[#6B6B6B]">{o.createdAt.toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</p>
 </div>
 <p className="font-bold text-[#171717]">{formatKES(o.total)}</p>
 </div>
 <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
 <span className={`rounded-full px-2.5 py-1 font-semibold ${o.paymentStatus === "SUCCESSFUL" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
 {PAYMENT_STATUS_LABELS[o.paymentStatus] ?? o.paymentStatus}
 </span>
 <span className="rounded-full bg-white/45 px-2.5 py-1 font-semibold text-[#171717]">{ORDER_STATUS_LABELS[o.orderStatus] ?? o.orderStatus}</span>
 {receipt && <span className="rounded-full bg-white/45 px-2.5 py-1 text-[#6B6B6B]">Receipt {receipt}</span>}
 <span className="text-[#6B6B6B]">| {o.items.length} item{o.items.length === 1 ? "" : "s"} | {o.county}</span>
 </div>
 </Link>
 );
 })}
 </div>
 );
}