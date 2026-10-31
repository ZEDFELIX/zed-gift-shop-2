import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { getOrdersForUser } from "@/lib/data/orders";
import { prisma } from "@/lib/prisma";
import { formatKES } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { ArrowRight, ArrowUpRight, CalendarDays, MapPin, Package, PackageCheck, ShoppingBag, Sparkles } from "lucide-react";

export const metadata = { title: "My account" };

export default async function AccountOverviewPage() {
 const user = (await getCurrentUser())!;
 const [orders, addressCount, reminderCount] = await Promise.all([
  getOrdersForUser(user.id),
  prisma.address.count({ where: { userId: user.id } }),
  prisma.occasionReminder.count({ where: { userId: user.id } }),
 ]);
 const completedOrders = orders.filter((order) => ["DELIVERED", "COMPLETED"].includes(order.orderStatus)).length;
 const firstName = user.name.trim().split(/\s+/)[0] || "there";

 return (
  <div className="space-y-5 sm:space-y-6">
   <section className="relative isolate overflow-hidden rounded-[28px] bg-[#71394f] px-5 py-6 text-white shadow-[0_18px_50px_rgba(113,57,79,0.18)] sm:px-8 sm:py-8">
    <div className="absolute -right-12 -top-20 -z-10 size-64 rounded-full border-[35px] border-white/[0.06]" />
    <div className="absolute -bottom-24 right-24 -z-10 size-52 rounded-full bg-[#9d6578]/30 blur-2xl" />
    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#f0cbd7]">Your Zed Gift Shop space</p>
    <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
     <div className="min-w-0">
      <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Welcome back, {firstName}.</h2>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/75">Everything you need for your orders, saved gifts and special occasions — all in one place.</p>
     </div>
     <Link href="/shop" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-bold text-[#54283b] transition hover:bg-[#f6e9ed]">Explore gifts <ArrowUpRight className="size-4" /></Link>
    </div>
   </section>

   <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
    {[
     { label: "Total orders", value: orders.length, icon: Package, href: "/account/orders", note: "Your purchases" },
     { label: "Delivered", value: completedOrders, icon: PackageCheck, href: "/account/orders", note: "Successfully received" },
     { label: "Saved addresses", value: addressCount, icon: MapPin, href: "/account/addresses", note: "Delivery destinations" },
     { label: "Reminders", value: reminderCount, icon: CalendarDays, href: "/account/reminders", note: "Dates to remember" },
    ].map(({ label, value, icon: Icon, href, note }) => (
     <Link key={label} href={href} className="group rounded-2xl border border-[#eee5e3] bg-white p-4 shadow-[0_5px_20px_rgba(43,32,38,0.035)] transition hover:-translate-y-0.5 hover:border-[#d9bdc7] hover:shadow-md sm:p-5">
      <div className="flex items-center justify-between gap-2"><span className="grid size-9 place-items-center rounded-xl bg-[#f6edf0] text-[#71394f]"><Icon className="size-[18px]" /></span><ArrowUpRight className="size-4 text-[#b9a7ad] transition group-hover:text-[#71394f]" /></div>
      <p className="mt-4 font-display text-2xl font-bold text-[#2b2026] sm:text-3xl">{value}</p>
      <p className="mt-0.5 text-xs font-bold text-[#493942] sm:text-sm">{label}</p>
      <p className="mt-1 text-[10px] text-[#9b8b91] sm:text-xs">{note}</p>
     </Link>
    ))}
   </section>

   <section className="overflow-hidden rounded-[24px] border border-[#eee5e3] bg-white shadow-[0_5px_20px_rgba(43,32,38,0.035)]">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0e9e7] px-5 py-4 sm:px-6">
     <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a17b89]">Your shopping activity</p><h3 className="mt-1 font-display text-lg font-bold text-[#2b2026]">Recent orders</h3></div>
     <Link href="/account/orders" className="inline-flex items-center gap-1 text-xs font-bold text-[#71394f] hover:underline">View all <ArrowRight className="size-3.5" /></Link>
    </div>
    {orders.length === 0 ? (
     <div className="px-5 py-10 text-center sm:px-6">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#f6edf0] text-[#71394f]"><ShoppingBag className="size-6" /></span>
      <h4 className="mt-4 text-sm font-bold text-[#2b2026]">Your next favourite gift starts here</h4>
      <p className="mt-1 text-xs text-[#887a80]">You haven&apos;t placed an order yet.</p>
      <Link href="/shop" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#71394f] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#54283b]">Browse the shop <ArrowRight className="size-3.5" /></Link>
     </div>
    ) : (
     <ul className="divide-y divide-[#f2ecea] px-5 sm:px-6">
      {orders.slice(0, 5).map((order) => (
       <li key={order.id}>
        <Link href={`/account/orders/${order.id}`} className="flex flex-wrap items-center gap-3 py-4 transition hover:bg-[#fdfafb] sm:flex-nowrap">
         <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f6edf0] text-[#71394f]"><Package className="size-[18px]" /></span>
         <span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-[#30232a] sm:text-sm">{order.orderNumber}</span><span className="mt-1 block text-[10px] text-[#9b8b91]">{order.createdAt.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</span></span>
         <span className="rounded-full bg-[#f6f1ee] px-2.5 py-1 text-[10px] font-semibold text-[#75656b]">{ORDER_STATUS_LABELS[order.orderStatus] ?? order.orderStatus}</span>
         <span className="w-full text-right text-sm font-bold text-[#30232a] sm:w-auto sm:min-w-24">{formatKES(order.total)}</span>
        </Link>
       </li>
      ))}
     </ul>
    )}
   </section>

   <section className="grid gap-3 sm:grid-cols-2">
    <Link href="/account/settings" className="flex items-center gap-3 rounded-2xl border border-[#eee5e3] bg-white p-4 transition hover:border-[#d9bdc7]">
     <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-[#f6edf0] text-sm font-bold text-[#71394f]">{user.avatarUrl ? <Image src={user.avatarUrl} alt="" fill sizes="44px" className="object-cover" unoptimized /> : user.name.trim().charAt(0).toUpperCase()}</span>
     <span className="min-w-0 flex-1"><span className="block text-xs font-bold text-[#30232a]">Profile details</span><span className="mt-1 block truncate text-[10px] text-[#9b8b91]">{user.email}</span></span><ArrowUpRight className="size-4 text-[#a17b89]" />
    </Link>
    <Link href="/account/reminders" className="flex items-center gap-3 rounded-2xl border border-[#eee5e3] bg-white p-4 transition hover:border-[#d9bdc7]">
     <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#f6edf0] text-[#71394f]"><Sparkles className="size-5" /></span>
     <span className="min-w-0 flex-1"><span className="block text-xs font-bold text-[#30232a]">Never miss a special day</span><span className="mt-1 block text-[10px] text-[#9b8b91]">Manage your occasion reminders</span></span><ArrowUpRight className="size-4 text-[#a17b89]" />
    </Link>
   </section>
  </div>
 );
}
