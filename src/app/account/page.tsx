import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getOrdersForUser } from "@/lib/data/orders";
import { prisma } from "@/lib/prisma";
import { formatKES } from "@/lib/utils";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { ArrowRight, Package, Sparkles } from "lucide-react";

export const metadata = { title: "My account" };

export default async function AccountOverviewPage() {
 const user = (await getCurrentUser())!;
 const [orders, addressCount, reminderCount, wishlistCount] = await Promise.all([
 getOrdersForUser(user.id),
 prisma.address.count({ where: { userId: user.id } }),
 prisma.occasionReminder.count({ where: { userId: user.id } }),
 prisma.wishlistItem.count({ where: { wishlist: { userId: user.id } } }),
 ]);

 return (
 <div className="space-y-6">
 <section className="glass-card rounded-zed p-6">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div>
 <p className="font-display text-lg font-bold text-[#171717]">{user.name}</p>
 <p className="text-sm text-[#6B6B6B]">{user.email}</p>
 {user.phone && <p className="text-sm text-[#6B6B6B]">{user.phone}</p>}
 </div>
 <div className="text-right text-sm">
 <p className="text-[#6B6B6B]">Member since</p>
 <p className="font-semibold text-[#171717]">{user.createdAt.toLocaleDateString("en-KE", { month: "short", year: "numeric" })}</p>
 </div>
 </div>
 </section>

 <section className="grid gap-3 sm:grid-cols-3">
 <Link href="/account/orders" className="glass-card rounded-zed p-5 transition-all hover:-translate-y-1 hover:shadow-glass-lg">
 <Package className="size-5 text-soft-sage" />
 <p className="mt-2 font-display text-2xl font-bold text-[#171717]">{orders.length}</p>
 <p className="text-sm text-[#6B6B6B]">Orders</p>
 </Link>
 <Link href="/account/reminders" className="glass-card rounded-zed p-5 transition-all hover:-translate-y-1 hover:shadow-glass-lg">
 <Sparkles className="size-5 text-soft-sage" />
 <p className="mt-2 font-display text-2xl font-bold text-[#171717]">{reminderCount}</p>
 <p className="text-sm text-[#6B6B6B]">Occasion reminders</p>
 </Link>
 <Link href="/wishlist" className="glass-card rounded-zed p-5 transition-all hover:-translate-y-1 hover:shadow-glass-lg">
 <p className="font-display text-2xl font-bold text-[#171717]">{wishlistCount}</p>
 <p className="text-sm text-[#6B6B6B]">Saved favourites</p>
 </Link>
 </section>

 <section className="glass-card rounded-zed p-6">
 <div className="flex items-center justify-between">
 <h2 className="font-display text-lg font-bold text-[#171717]">Recent orders</h2>
 <Link href="/account/orders" className="flex items-center gap-1 text-sm font-semibold text-soft-sage hover:underline">All orders <ArrowRight className="size-3.5" /></Link>
 </div>
 {orders.length === 0 ? (
 <p className="mt-4 text-sm text-[#6B6B6B]">
 No orders yet.{" "}
 <Link href="/shop" className="text-soft-sage underline underline-offset-2">Start shopping</Link>
 </p>
 ) : (
 <ul className="mt-3 divide-y divide-white/40">
 {orders.slice(0, 5).map((o) => (
 <li key={o.id}>
 <Link href={`/account/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm hover:text-soft-sage">
 <span className="font-semibold text-[#171717]">{o.orderNumber}</span>
 <span className="hidden text-[#6B6B6B] sm:block">{o.createdAt.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</span>
 <span>{ORDER_STATUS_LABELS[o.orderStatus] ?? o.orderStatus}</span>
 <span className="font-bold text-[#171717]">{formatKES(o.total)}</span>
 </Link>
 </li>
 ))}
 </ul>
 )}
 </section>
 </div>
 );
}