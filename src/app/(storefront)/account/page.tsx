import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getOrdersForUser } from "@/lib/data/orders";
import { prisma } from "@/lib/prisma";
import { formatKES } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import {
 ArrowRight, ArrowUpRight, Bell, CalendarDays, Heart, MapPin, Package,
 PackageCheck, Search, Settings, ShoppingBag, UserRound
} from "lucide-react";

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
  { label: "Total orders", value: orders.length, icon: Package, href: "/account/orders" },
  { label: "Delivered", value: completedOrders, icon: PackageCheck, href: "/account/orders" },
  { label: "Saved addresses", value: addressCount, icon: MapPin, href: "/account/addresses" },
  { label: "Date reminders", value: reminderCount, icon: CalendarDays, href: "/account/reminders" },
 ];
 const actions = [
  { label: "Browse gifts", detail: "Find something special", icon: Search, href: "/shop", tone: "bg-[#202020] text-white" },
  { label: "Track an order", detail: "View order progress", icon: Package, href: "/account/orders", tone: "bg-[#f1f1f1] text-[#252525]" },
  { label: "Saved gifts", detail: "Your wishlist", icon: Heart, href: "/account/wishlist", tone: "bg-[#f1f1f1] text-[#252525]" },
  { label: "Add an address", detail: "Speed up checkout", icon: MapPin, href: "/account/addresses", tone: "bg-[#f1f1f1] text-[#252525]" },
  { label: "Set a reminder", detail: "Never miss a special day", icon: Bell, href: "/account/reminders", tone: "bg-[#f1f1f1] text-[#252525]" },
  { label: "Profile settings", detail: "Update your details", icon: UserRound, href: "/account/settings", tone: "bg-[#f1f1f1] text-[#252525]" },
 ];

 return (
  <div className="space-y-4 sm:space-y-5">
   <section className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ededed] pb-3">
    <div className="min-w-0">
     <p className="text-[9px] font-semibold uppercase tracking-[0.17em] text-[#999]">Your space</p>
     <h2 className="mt-0.5 text-[clamp(17px,4vw,22px)] font-semibold leading-tight tracking-tight text-[#171717]">Account overview</h2>
     <p className="mt-1 text-[10px] text-[#888] min-[380px]:text-[11px] sm:text-xs">Everything you need to manage your Zed Gift Shop experience.</p>
    </div>
    <Link href="/shop" className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full bg-[#202020] px-3 text-[10px] font-semibold text-white transition hover:bg-black sm:min-h-9 sm:px-3.5 sm:text-[11px]">Shop now <ArrowUpRight className="size-3.5" /></Link>
   </section>

   <section aria-label="Account summary" className="grid grid-cols-2 gap-2 min-[520px]:grid-cols-4">
    {stats.map(({ label, value, icon: Icon, href }) => (
     <Link key={label} href={href} className="group flex min-w-0 items-center gap-2 rounded-[13px] border border-[#e8e8e8] bg-[#fafafa] p-2.5 transition hover:border-[#bdbdbd] hover:bg-white min-[380px]:gap-2.5 min-[380px]:p-3 sm:rounded-[15px] sm:p-3.5">
      <span className="grid size-7 shrink-0 place-items-center rounded-[9px] bg-[#202020] text-white min-[380px]:size-8"><Icon className="size-3.5" /></span>
      <span className="min-w-0"><span className="block text-lg font-semibold leading-none tabular-nums text-[#171717] min-[380px]:text-xl">{value}</span><span className="mt-1 block truncate text-[9px] font-medium text-[#777] min-[380px]:text-[10px]">{label}</span></span>
      <ArrowUpRight className="ml-auto size-3 shrink-0 text-[#aaa] transition group-hover:text-[#222]" />
     </Link>
    ))}
   </section>

   <section>
    <div className="mb-2 flex items-end justify-between gap-2">
     <div><p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#999]">Get things done</p><h3 className="mt-0.5 text-[13px] font-semibold text-[#171717] sm:text-sm">Quick actions</h3></div>
     <span className="text-[9px] text-[#999]">Your account shortcuts</span>
    </div>
    <div className="grid grid-cols-2 gap-2 min-[560px]:grid-cols-3">
     {actions.map(({ label, detail, icon: Icon, href, tone }) => (
      <Link key={label} href={href} className="group flex min-w-0 items-center gap-2.5 rounded-[13px] border border-[#e8e8e8] bg-white p-2.5 transition hover:-translate-y-0.5 hover:border-[#c9c9c9] hover:bg-[#fafafa] min-[380px]:p-3 sm:rounded-[15px] sm:p-3.5">
       <span className={`grid size-8 shrink-0 place-items-center rounded-[10px] ${tone} sm:size-9`}><Icon className="size-4" /></span>
       <span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-semibold text-[#222] sm:text-[11px]">{label}</span><span className="mt-0.5 block truncate text-[9px] text-[#999]">{detail}</span></span>
       <ArrowUpRight className="size-3 shrink-0 text-[#aaa] transition group-hover:text-[#222]" />
      </Link>
     ))}
    </div>
   </section>

   <section className="flex flex-col gap-3 overflow-hidden rounded-[14px] border border-[#e8e8e8] bg-[#f8f8f8] p-3 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between sm:rounded-[16px] sm:px-4 sm:py-3.5">
    <div className="flex min-w-0 items-center gap-2.5">
     <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-[#202020] text-white"><CalendarDays className="size-4" /></span>
     <div className="min-w-0"><p className="text-[11px] font-semibold text-[#222]">Plan your next celebration</p><p className="mt-0.5 text-[9px] text-[#888]">Add birthdays and special dates so you can plan ahead.</p></div>
    </div>
    <Link href="/account/reminders" className="inline-flex min-h-8 shrink-0 items-center justify-center gap-1.5 self-start rounded-full border border-[#d9d9d9] bg-white px-3 text-[10px] font-semibold text-[#333] transition hover:border-[#999] min-[520px]:self-auto">Manage reminders <ArrowRight className="size-3" /></Link>
   </section>

   <section className="overflow-hidden rounded-[14px] border border-[#e8e8e8] sm:rounded-[16px]">
    <div className="flex items-center justify-between gap-2 border-b border-[#ededed] px-3 py-2.5 sm:px-4">
     <div><p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#999]">Order history</p><h3 className="mt-0.5 text-[13px] font-semibold text-[#171717] sm:text-sm">Recent purchases</h3></div>
     <Link href="/account/orders" className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-[#555] hover:text-black">View all orders <ArrowRight className="size-3" /></Link>
    </div>
    {orders.length === 0 ? (
     <div className="px-3 py-8 text-center sm:py-10">
      <span className="mx-auto grid size-10 place-items-center rounded-full bg-[#f2f2f2] text-[#555]"><ShoppingBag className="size-4" /></span>
      <h4 className="mt-2.5 text-xs font-semibold text-[#222]">Your order list is waiting</h4>
      <p className="mt-1 text-[10px] text-[#888]">Once you place an order, you can follow its progress here.</p>
      <Link href="/shop" className="mt-3 inline-flex min-h-8 items-center gap-1.5 rounded-full bg-[#202020] px-3 text-[10px] font-semibold text-white hover:bg-black">Explore gifts <ArrowRight className="size-3" /></Link>
     </div>
    ) : (
     <ul className="divide-y divide-[#ededed]">
      {orders.slice(0, 5).map((order) => (
       <li key={order.id}>
        <Link href={`/account/orders/${order.id}`} className="flex min-w-0 items-center gap-2 px-3 py-2.5 transition hover:bg-[#fafafa] sm:gap-3 sm:px-4 sm:py-3">
         <span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-[#f1f1f1] text-[#555]"><Package className="size-3.5" /></span>
         <span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-semibold text-[#222] sm:text-xs">{order.orderNumber}</span><span className="mt-0.5 block text-[9px] text-[#999]">{order.createdAt.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</span></span>
         <span className="max-w-[86px] truncate rounded-full bg-[#f1f1f1] px-2 py-1 text-[8px] font-medium text-[#555] min-[380px]:text-[9px]">{ORDER_STATUS_LABELS[order.orderStatus] ?? order.orderStatus}</span>
         <span className="shrink-0 text-[10px] font-semibold text-[#222] min-[380px]:text-[11px]">{formatKES(order.total)}</span>
        </Link>
       </li>
      ))}
     </ul>
    )}
   </section>

   <section className="grid grid-cols-2 gap-2">
    <Link href="/account/addresses" className="group flex min-w-0 items-center gap-2 rounded-[13px] border border-[#e8e8e8] p-2.5 transition hover:bg-[#fafafa] min-[380px]:p-3">
     <span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-[#f1f1f1] text-[#444]"><MapPin className="size-3.5" /></span>
     <span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-semibold text-[#222]">Addresses</span><span className="mt-0.5 block truncate text-[9px] text-[#999]">Delivery locations</span></span><ArrowUpRight className="size-3 shrink-0 text-[#aaa] group-hover:text-[#222]" />
    </Link>
    <Link href="/account/settings" className="group flex min-w-0 items-center gap-2 rounded-[13px] border border-[#e8e8e8] p-2.5 transition hover:bg-[#fafafa] min-[380px]:p-3">
     <span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-[#f1f1f1] text-[#444]"><Settings className="size-3.5" /></span>
     <span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-semibold text-[#222]">Account settings</span><span className="mt-0.5 block truncate text-[9px] text-[#999]">Profile and preferences</span></span><ArrowUpRight className="size-3 shrink-0 text-[#aaa] group-hover:text-[#222]" />
    </Link>
   </section>
  </div>
 );
}
