"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, Heart, House, LayoutDashboard, MapPin, Package, Settings } from "lucide-react";

const TABS = [
  { href: "/account", label: "Account overview", icon: House },
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
   <nav aria-label="Account navigation" className="rounded-[22px] border border-[#e5e5e5] bg-white p-2 shadow-[0_3px_14px_rgba(0,0,0,0.025)]">
    <p className="hidden px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#999] lg:block">Your account</p>
    <div className="flex gap-1 overflow-x-auto scrollbar-none lg:flex-col lg:overflow-visible">
     {tabs.map(({ href, label, icon: Icon }) => {
      const active = pathname === href || (href !== "/account" && pathname.startsWith(href));
      return (
       <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-11 shrink-0 items-center gap-3 rounded-[14px] px-3 py-2.5 text-xs font-semibold transition lg:w-full ${active ? "bg-[#202020] text-white shadow-sm" : "text-[#666] hover:bg-[#f3f3f3] hover:text-[#171717]"}`}>
        <Icon className="size-[17px] shrink-0" /> <span className="whitespace-nowrap">{label}</span>
       </Link>
      );
     })}
    </div>
    <div className="mt-3 hidden rounded-[15px] bg-[#f5f5f5] px-3 py-3 lg:block">
     <p className="text-[10px] font-semibold text-[#333]">Need a hand?</p>
     <p className="mt-1 text-[10px] leading-relaxed text-[#888]">Our team is ready to help with your orders and gifts.</p>
    </div>
   </nav>
  );
}
