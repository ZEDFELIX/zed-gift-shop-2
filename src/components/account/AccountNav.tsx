"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, Heart, House, LayoutDashboard, LogOut, MapPin, Package, Settings, UserRound } from "lucide-react";

const TABS = [
  { href: "/account", label: "Overview", icon: House },
  { href: "/account/orders", label: "My orders", icon: Package },
  { href: "/account/wishlist", label: "Saved gifts", icon: Heart },
  { href: "/account/addresses", label: "Delivery addresses", icon: MapPin },
  { href: "/account/reminders", label: "Occasion reminders", icon: Bell },
  { href: "/account/settings", label: "Profile & settings", icon: Settings },
];

export function AccountNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const tabs = isAdmin
    ? [...TABS, { href: "/admin", label: "Admin dashboard", icon: LayoutDashboard }]
    : TABS;
  return (
   <aside className="min-w-0 overflow-hidden rounded-[26px] bg-[#2b2026] p-3 text-white shadow-[0_16px_45px_rgba(43,32,38,0.12)] lg:sticky lg:top-24 lg:p-4">
    <div className="hidden border-b border-white/10 px-3 pb-4 pt-2 lg:block">
     <div className="mb-3 grid size-10 place-items-center rounded-2xl bg-white/10"><UserRound className="size-5 text-[#e7c6cf]" /></div>
     <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d7aebb]">Your space</p>
     <p className="mt-1 text-sm font-semibold text-white">Manage your shopping</p>
    </div>
    <nav aria-label="Account navigation" className="flex gap-1 overflow-x-auto scrollbar-none lg:flex-col lg:overflow-visible lg:pt-3">
     {tabs.map(({ href, label, icon: Icon }) => {
      const active = pathname === href || (href !== "/account" && pathname.startsWith(href));
      return (
       <Link key={href} href={href} className={`flex min-h-11 shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all sm:text-sm lg:w-full ${active ? "bg-[#f3e8eb] text-[#55283b] shadow-sm" : "text-white/75 hover:bg-white/10 hover:text-white"}`}>
        <Icon className="size-4 shrink-0" /> <span>{label}</span>
       </Link>
      );
     })}
    </nav>
    <div className="mt-4 hidden border-t border-white/10 px-3 pt-4 lg:block">
     <Link href="/shop" className="flex items-center gap-2 text-xs font-semibold text-[#e7c6cf] transition hover:text-white"><LogOut className="size-4" /> Continue shopping</Link>
    </div>
   </aside>
  );
}
