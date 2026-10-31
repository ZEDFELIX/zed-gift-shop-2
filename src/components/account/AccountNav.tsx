"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, Heart, House, LayoutDashboard, MapPin, Package, Settings } from "lucide-react";

const TABS = [
  { href: "/account", label: "Overview", icon: House },
  { href: "/account/orders", label: "My orders", icon: Package },
  { href: "/account/wishlist", label: "Saved gifts", icon: Heart },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/reminders", label: "Reminders", icon: Bell },
  { href: "/account/settings", label: "Profile & settings", icon: Settings },
];

export function AccountNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const tabs = isAdmin
    ? [...TABS, { href: "/admin", label: "Admin dashboard", icon: LayoutDashboard }]
    : TABS;

  return (
   <nav aria-label="Account navigation" className="rounded-2xl border border-[#e5e5e5] bg-white p-2 shadow-[0_2px_10px_rgba(0,0,0,0.025)]">
    <div className="flex gap-1 overflow-x-auto scrollbar-none">
     {tabs.map(({ href, label, icon: Icon }) => {
      const active = pathname === href || (href !== "/account" && pathname.startsWith(href));
      return (
       <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition sm:px-4 sm:text-sm ${active ? "border-[#222] bg-[#222] text-white" : "border-transparent text-[#666] hover:border-[#e5e5e5] hover:bg-[#f5f5f5] hover:text-[#171717]"}`}>
        <Icon className="size-4 shrink-0" /> <span>{label}</span>
       </Link>
      );
     })}
    </div>
   </nav>
  );
}
