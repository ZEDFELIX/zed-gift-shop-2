import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getOrdersForUser } from "@/lib/data/orders";
import { prisma } from "@/lib/prisma";
import { formatKES } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { ArrowRight, ArrowUpRight, CalendarDays, MapPin, Package, PackageCheck, ShoppingBag } from "lucide-react";

export const metadata = { title: "My account" };

export default async function AccountOverviewPage() {
 const user = (await getCurrentUser())!;
 const [orders, addressCount, reminderCount] = await Promise.all([
  getOrdersForUser(user.id),
  prisma.address.count({ where: { userId: user.id } }),
  prisma.occasionReminder.count({ where: { userId: user.id } }),
 ]);
 const completedOrders = orders.filter((order) => ["DELIVERED", "COMPLETED"].includes(order.orderStatus)).length;
 const stats = [
  { label: "All orders", value: orders.length, icon: Package, href: "/account/orders" },
  { label: "Delivered", value: completedOrders, icon: PackageCheck, href: "/account/orders" },
  { label: "Addresses", value: addressCount, icon: MapPin, href: "/account/addresses" },
  { label: "Reminders", value: reminderCount, icon: CalendarDays, href: "/account/reminders" },
 ];

 return (
  <div className="space-y-7 sm:space-y-8">
   <section className="flex flex-wrap items-end justify-between gap-3 border-b border-[#ededed] pb-5">
    <div>
     <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#999]">Your space</p>
     <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#171717]">Account overview</h2>
     <p className="mt-1 text-xs text-[#888] sm:text-sm">Your orders, saved details and special dates in one place.</p>
    </div>
    <Link href="/shop" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#202020] px-4 text-xs font-semibold text-white transition hover:bg-black">Start shopping <ArrowUpRight className="size-4" /></Link>
   </section>

   <section aria-label="Account summary" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
    {stats.map(({ label, value, icon: Icon, href }) => (
     <Link key={label} href={href} className="group flex items-center gap-3 rounded-[18px] border border-[#e8e8e8] bg-[#fafafa] p-4 transition hover:border-[#bdbdbd] hover:bg-white sm:p-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-[#202020] text-white"><Icon className="size-[17px]" /></span>
      <span className="min-w-0"><span className="block text-2xl font-semibold leading-none tabular-nums text-[#171717]">{value}</span><span className="mt-1.5 block truncate text-[11px] font-medium text-[#777]">{label}</span></span>
      <ArrowUpRight className="ml-auto size-4 shrink-0 text-[#aaa] transition group-hover:text-[#222]" />
     </Link>
    ))}
   </section>

   <section className="overflow-hidden rounded-[19px] border border-[#e8e8e8]">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ededed] px-4 py-4 sm:px-5">
     <div><p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#999]">Order history</p><h3 className="mt-1 text-base font-semibold text-[#171717]">Your recent purchases</h3></div>
     <Link href="/account/orders" className="inline-flex items-center gap-1 text-xs font-semibold text-[#555] hover:text-black">All orders <ArrowRight className="size-3.5" /></Link>
    </div>
    {orders.length === 0 ? (
     <div className="px-5 py-12 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#f2f2f2] text-[#555]"><ShoppingBag className="size-6" /></span>
      <h4 className="mt-4 text-sm font-semibold text-[#222]">Nothing here just yet</h4>
      <p className="mt-1 text-xs text-[#888]">Once you place an order, you’ll find its progress and details here.</p>
      <Link href="/shop" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-[#202020] px-4 text-xs font-semibold text-white hover:bg-black">Explore gifts <ArrowRight className="size-3.5" /></Link>
     </div>
    ) : (
     <ul className="divide-y divide-[#ededed]">
      {orders.slice(0, 5).map((order) => (
       <li key={order.id}>
        <Link href={`/account/orders/${order.id}`} className="flex flex-wrap items-center gap-3 px-4 py-4 transition hover:bg-[#fafafa] sm:flex-nowrap sm:px-5">
         <span className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-[#f1f1f1] text-[#555]"><Package className="size-[18px]" /></span>
         <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-[#222] sm:text-sm">{order.orderNumber}</span><span className="mt-1 block text-[10px] text-[#999]">{order.createdAt.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</span></span>
         <span className="rounded-full bg-[#f1f1f1] px-2.5 py-1 text-[10px] font-medium text-[#555]">{ORDER_STATUS_LABELS[order.orderStatus] ?? order.orderStatus}</span>
         <span className="w-full text-right text-sm font-semibold text-[#222] sm:w-auto sm:min-w-24">{formatKES(order.total)}</span>
        </Link>
       </li>
      ))}
     </ul>
    )}
   </section>

   <section className="grid gap-3 sm:grid-cols-2">
    <Link href="/account/addresses" className="group flex items-center gap-3 rounded-[18px] border border-[#e8e8e8] p-4 transition hover:bg-[#fafafa]">
     <span className="grid size-11 shrink-0 place-items-center rounded-[13px] bg-[#f1f1f1] text-[#444]"><MapPin className="size-5" /></span>
     <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-[#222]">Delivery addresses</span><span className="mt-1 block text-[10px] text-[#999]">Manage your delivery locations</span></span><ArrowUpRight className="size-4 text-[#aaa] group-hover:text-[#222]" />
    </Link>
    <Link href="/account/reminders" className="group flex items-center gap-3 rounded-[18px] border border-[#e8e8e8] p-4 transition hover:bg-[#fafafa]">
     <span className="grid size-11 shrink-0 place-items-center rounded-[13px] bg-[#f1f1f1] text-[#444]"><CalendarDays className="size-5" /></span>
     <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-[#222]">Occasion reminders</span><span className="mt-1 block text-[10px] text-[#999]">Never miss a special date</span></span><ArrowUpRight className="size-4 text-[#aaa] group-hover:text-[#222]" />
    </Link>
   </section>
  </div>
 );
}
