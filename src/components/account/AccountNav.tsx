"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, Heart, House, LayoutDashboard, MapPin, Package, Settings } from "lucide-react";

const TABS = [
  { href: "/account", label: "Overview", icon: House },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/wishlist", label: "Saved gifts", icon: Heart },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/reminders", label: "Reminders", icon: Bell },
  { href: "/account/settings", label: "Settings", icon: Settings },
];

export function AccountNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const tabs = isAdmin ? [...TABS, { href: "/admin", label: "Admin", icon: LayoutDashboard }] : TABS;

  return (
   <nav aria-label="Account navigation" className="rounded-[14px] border border-[#e5e5e5] bg-white p-1 shadow-[0_2px_8px_rgba(0,0,0,0.02)] sm:rounded-[16px] sm:p-1.5">
    <div className="flex gap-1 overflow-x-auto scrollbar-none lg:flex-col lg:overflow-visible">
     {tabs.map(({ href, label, icon: Icon }) => {
      const active = pathname === href || (href !== "/account" && pathname.startsWith(href));
      return (
       <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-9 shrink-0 items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-[10px] font-semibold transition min-[380px]:gap-2 min-[380px]:px-3 sm:min-h-9 sm:text-[11px] lg:w-full ${active ? "bg-[#202020] text-white" : "text-[#666] hover:bg-[#f3f3f3] hover:text-[#171717]"}`}>
        <Icon className="size-3.5 shrink-0 sm:size-4" /><span className="whitespace-nowrap">{label}</span>
       </Link>
      );
     })}
    </div>
   </nav>
  );
}
