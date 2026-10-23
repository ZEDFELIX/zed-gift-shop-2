import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getOrdersForUser } from "@/lib/data/orders";
import { prisma } from "@/lib/prisma";
import { formatKES } from "@/lib/utils";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { ArrowRight, Package, ShieldCheck, Sparkles } from "lucide-react";

export const metadata = { title: "My account" };

export default async function AccountOverviewPage() {
 const user = (await getCurrentUser())!;
 const [orders, addressCount, reminderCount] = await Promise.all([
 getOrdersForUser(user.id),
 prisma.address.count({ where: { userId: user.id } }),
 prisma.occasionReminder.count({ where: { userId: user.id } }),
 ]);

  return (
  <div className="space-y-3 sm:space-y-5">
  {(user.role === "ADMIN") && (
  <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-zed-950 p-3 sm:rounded-2xl sm:p-4 text-white">
  <div className="flex items-center gap-3">
  <span className="grid size-8 place-items-center rounded-full bg-white/15"><ShieldCheck className="size-5" /></span>
  <div>
  <p className="font-display text-sm sm:text-base font-bold">You&apos;re signed in as {user.role === "ADMIN" ? "an admin" : "staff"}</p>
  <p className="text-xs leading-snug text-white/70">Jump to the admin dashboard to manage orders, products and settings.</p>
  </div>
  </div>
  <Link href="/admin" className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs sm:text-sm font-bold text-zed-950 transition-colors hover:bg-white/85">
  Open admin <ArrowRight className="size-4" />
  </Link>
  </section>
  )}
  <section className="glass-card rounded-xl p-3 sm:rounded-2xl sm:p-4">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div>
 <p className="font-display text-base sm:text-lg font-bold text-[#07111F]">{user.name}</p>
 <p className="text-xs sm:text-sm text-[#334155]">{user.email}</p>
 {user.phone && <p className="text-sm text-[#334155]">{user.phone}</p>}
 </div>
 <div className="text-right text-xs sm:text-sm">
 <p className="text-[#334155]">Member since</p>
 <p className="font-semibold text-[#07111F]">{user.createdAt.toLocaleDateString("en-KE", { month: "short", year: "numeric" })}</p>
 </div>
 </div>
 </section>

 <section className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3">
 <Link href="/account/orders" className="glass-card rounded-xl p-3 sm:rounded-2xl sm:p-4 transition-all hover:-translate-y-1 hover:shadow-glass-lg">
 <Package className="size-5 text-soft-sage" />
 <p className="mt-1.5 font-display text-xl sm:text-2xl font-bold text-[#07111F]">{orders.length}</p>
 <p className="text-xs sm:text-sm text-[#334155]">Orders</p>
 </Link>
 <Link href="/account/reminders" className="glass-card rounded-zed p-5 transition-all hover:-translate-y-1 hover:shadow-glass-lg">
 <Sparkles className="size-5 text-soft-sage" />
 <p className="mt-2 font-display text-2xl font-bold text-[#07111F]">{reminderCount}</p>
 <p className="text-xs sm:text-sm text-[#334155]">Occasion reminders</p>
 </Link>
 </section>

 <section className="glass-card rounded-zed p-6">
 <div className="flex items-center justify-between">
 <h2 className="font-display text-sm sm:text-lg font-bold text-[#07111F]">Recent orders</h2>
 <Link href="/account/orders" className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-soft-sage hover:underline">All orders <ArrowRight className="size-3.5" /></Link>
 </div>
 {orders.length === 0 ? (
 <p className="mt-4 text-sm text-[#334155]">
 No orders yet.{" "}
 <Link href="/shop" className="text-soft-sage underline underline-offset-2">Start shopping</Link>
 </p>
 ) : (
 <ul className="mt-2 divide-y divide-white/40">
 {orders.slice(0, 5).map((o) => (
 <li key={o.id}>
 <Link href={`/account/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs sm:py-3 sm:text-sm hover:text-soft-sage">
 <span className="font-semibold text-[#07111F]">{o.orderNumber}</span>
 <span className="hidden text-[#334155] sm:block">{o.createdAt.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</span>
 <span>{ORDER_STATUS_LABELS[o.orderStatus] ?? o.orderStatus}</span>
 <span className="font-bold text-[#07111F]">{formatKES(o.total)}</span>
 </Link>
 </li>
 ))}
 </ul>
 )}
 </section>
 </div>
 );
}