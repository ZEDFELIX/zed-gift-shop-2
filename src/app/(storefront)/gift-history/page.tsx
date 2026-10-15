import "server-only";

import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getOrdersForUser } from "@/lib/data/orders";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatKES } from "@/lib/utils";
import { Package, Repeat2, ArrowRight } from "lucide-react";

export const metadata = { title: "My Gift History" };

export default async function GiftHistoryPage() {
 const user = (await getCurrentUser())!;
 const orders = await getOrdersForUser(user.id);

 const giftOrders = orders.filter(
 (o) => o.isGift && o.orderStatus !== "CANCELLED" && o.orderStatus !== "REFUNDED"
 );

 return (
 <div className="container-zed py-10 lg:py-14">
 <header className="flex flex-wrap items-end justify-between gap-4">
 <div>
 <p className="eyebrow">Gifting history</p>
 <h1 className="mt-2 font-display text-3xl font-bold text-[#07111F]">My Gift History</h1>
 <p className="mt-1 text-sm text-[#334155]">
 Every gift you&apos;ve sent. Re-gift with one tap.
 </p>
 </div>
 <Link href="/account" className="flex items-center gap-1 text-sm font-semibold text-deep-olive hover:underline">
 Back to account <ArrowRight className="size-4" />
 </Link>
 </header>

 {giftOrders.length === 0 ? (
 <div className="glass-panel mx-auto mt-14 max-w-md rounded-zed p-10 text-center">
 <Package className="mx-auto size-12 text-soft-sage/50" />
 <p className="mt-4 font-display text-xl font-bold text-[#07111F]">No gift history yet</p>
 <p className="mt-2 text-sm text-[#334155]">When you send a gift, it appears here for future reference.</p>
 <Link href="/shop" className="mt-6 inline-flex rounded-zed bg-zed-950 px-6 py-3 text-sm font-bold text-white">
 Start gifting
 </Link>
 </div>
 ) : (
 <div className="mt-8 space-y-4">
 {giftOrders.map((order) => (
 <article key={order.id} className="glass-card rounded-zed p-5">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div>
 <p className="font-display text-sm font-bold text-[#07111F]">{order.orderNumber}</p>
 <p className="text-xs text-[#334155]">
 {order.createdAt.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
 </p>
 </div>
 <span className="rounded-full bg-warm-white px-2.5 py-1 text-xs font-semibold text-[#07111F]">
 {ORDER_STATUS_LABELS[order.orderStatus] ?? order.orderStatus}
 </span>
 </div>

 <ul className="mt-4 divide-y divide-white/40">
 {order.items.map((item) => (
 <li key={item.id} className="flex items-center justify-between py-3">
 <div className="min-w-0 flex-1">
 <p className="text-sm font-medium text-[#07111F]">{item.name}</p>
 {item.personalizationJson && (
 <p className="text-xs text-soft-sage">
 Personalized | {JSON.parse(item.personalizationJson).engravingText ?? ""}
 </p>
 )}
 </div>
 <p className="shrink-0 font-bold text-[#07111F]">{formatKES(item.price)}</p>
 </li>
 ))}
 </ul>

 <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
 <div className="flex items-center gap-2 text-sm text-[#334155]">
 <span>
 {order.items.length} item{order.items.length > 1 ? "s" : ""} |{" "}
 {formatKES(order.total)} total
 </span>
 {order.isGift && <span className="text-xs text-soft-sage"> Gift order</span>}
 </div>
 <Link
 href={`/track?order=${order.orderNumber}`}
 className="flex items-center gap-1 text-xs font-semibold text-deep-olive hover:underline"
 >
 Track <ArrowRight className="size-3" />
 </Link>
 </div>
 </article>
 ))}
 </div>
 )}
 </div>
 );
}
