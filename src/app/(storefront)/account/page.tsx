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
  { label: "Total orders", value: orders.length, icon: Package, href: "/account/orders", note: "All your purchases" },
  { label: "Delivered", value: completedOrders, icon: PackageCheck, href: "/account/orders", note: "Orders received" },
  { label: "Saved addresses", value: addressCount, icon: MapPin, href: "/account/addresses", note: "Delivery locations" },
  { label: "Reminders", value: reminderCount, icon: CalendarDays, href: "/account/reminders", note: "Special dates" },
 ];

 return (
  <div className="space-y-7 sm:space-y-9">
   <section className="flex flex-wrap items-end justify-between gap-3 border-b border-[#e5e5e5] pb-5">
    <div>
     <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#888]">Account centre</p>
     <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#171717] sm:text-2xl">Overview</h2>
     <p className="mt-1 text-sm text-[#737373]">A clear view of your shopping activity and account details.</p>
    </div>
    <Link href="/shop" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#222] px-4 text-xs font-semibold text-white transition hover:bg-black">Continue shopping <ArrowUpRight className="size-4" /></Link>
   </section>

   <section aria-label="Account summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
    {stats.map(({ label, value, icon: Icon, href, note }) => (
     <Link key={label} href={href} className="group rounded-2xl border border-[#e5e5e5] bg-white p-4 transition hover:border-[#bdbdbd] hover:shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-2">
       <span className="grid size-9 place-items-center rounded-full border border-[#e8e8e8] bg-[#f7f7f7] text-[#444]"><Icon className="size-[17px]" /></span>
       <ArrowUpRight className="size-4 text-[#aaa] transition group-hover:text-[#222]" />
      </div>
      <p className="mt-4 text-2xl font-semibold tabular-nums text-[#171717] sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs font-semibold text-[#333] sm:text-sm">{label}</p>
      <p className="mt-1 text-[10px] text-[#888] sm:text-xs">{note}</p>
     </Link>
    ))}
   </section>

   <section className="overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ededed] px-5 py-4 sm:px-6">
     <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#888]">Your shopping activity</p>
      <h3 className="mt-1 text-lg font-semibold text-[#171717]">Recent orders</h3>
     </div>
     <Link href="/account/orders" className="inline-flex items-center gap-1 text-xs font-semibold text-[#444] hover:text-black">View all <ArrowRight className="size-3.5" /></Link>
    </div>
    {orders.length === 0 ? (
     <div className="px-5 py-12 text-center sm:px-6">
      <span className="mx-auto grid size-14 place-items-center rounded-full border border-[#e5e5e5] bg-[#f7f7f7] text-[#555]"><ShoppingBag className="size-6" /></span>
      <h4 className="mt-4 text-sm font-semibold text-[#222]">No orders yet</h4>
      <p className="mt-1 text-xs text-[#888]">Your purchases will appear here when you place an order.</p>
      <Link href="/shop" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-[#222] px-4 text-xs font-semibold text-white hover:bg-black">Browse the shop <ArrowRight className="size-3.5" /></Link>
     </div>
    ) : (
     <ul className="divide-y divide-[#ededed] px-5 sm:px-6">
      {orders.slice(0, 5).map((order) => (
       <li key={order.id}>
        <Link href={`/account/orders/${order.id}`} className="flex flex-wrap items-center gap-3 py-4 transition hover:bg-[#fafafa] sm:flex-nowrap">
         <span className="grid size-10 shrink-0 place-items-center rounded-full border border-[#e8e8e8] bg-[#f7f7f7] text-[#555]"><Package className="size-[18px]" /></span>
         <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-[#222] sm:text-sm">{order.orderNumber}</span><span className="mt-1 block text-[10px] text-[#888]">{order.createdAt.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</span></span>
         <span className="rounded-full border border-[#e5e5e5] bg-[#f7f7f7] px-2.5 py-1 text-[10px] font-medium text-[#555]">{ORDER_STATUS_LABELS[order.orderStatus] ?? order.orderStatus}</span>
         <span className="w-full text-right text-sm font-semibold text-[#222] sm:w-auto sm:min-w-24">{formatKES(order.total)}</span>
        </Link>
       </li>
      ))}
     </ul>
    )}
   </section>

   <section className="grid gap-3 sm:grid-cols-2">
    <Link href="/account/addresses" className="flex items-center gap-3 rounded-2xl border border-[#e5e5e5] bg-white p-4 transition hover:border-[#bdbdbd] hover:shadow-sm">
     <span className="grid size-11 shrink-0 place-items-center rounded-full border border-[#e8e8e8] bg-[#f7f7f7] text-[#444]"><MapPin className="size-5" /></span>
     <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-[#222]">Delivery addresses</span><span className="mt-1 block text-[10px] text-[#888]">Manage where your gifts are delivered</span></span><ArrowUpRight className="size-4 text-[#999]" />
    </Link>
    <Link href="/account/reminders" className="flex items-center gap-3 rounded-2xl border border-[#e5e5e5] bg-white p-4 transition hover:border-[#bdbdbd] hover:shadow-sm">
     <span className="grid size-11 shrink-0 place-items-center rounded-full border border-[#e8e8e8] bg-[#f7f7f7] text-[#444]"><CalendarDays className="size-5" /></span>
     <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-[#222]">Occasion reminders</span><span className="mt-1 block text-[10px] text-[#888]">Keep track of important dates</span></span><ArrowUpRight className="size-4 text-[#999]" />
    </Link>
   </section>
  </div>
 );
}
