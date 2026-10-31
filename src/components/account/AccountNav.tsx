"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, Heart, House, LayoutDashboard, MapPin, Package, Settings } from "lucide-react";

const TABS = [
  { href: "/account", label: "Overview", icon: House },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/wishlist", label: "Saved gifts", icon: Heart },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/reminders", label: "Occasion reminders", icon: Bell },
  { href: "/account/settings", label: "Settings", icon: Settings },
];

export function AccountNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const tabs = isAdmin
    ? [...TABS, { href: "/admin", label: "Admin dashboard", icon: LayoutDashboard }]
    : TABS;
  return (
  <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-[#e9e9e9] bg-white p-1.5 shadow-sm scrollbar-none lg:flex-col lg:overflow-visible">
  {tabs.map(({ href, label, icon: Icon }) => {
  const active = pathname === href || (href !== "/account" && pathname.startsWith(href));
  return (
  <Link
  key={href}
  href={href}
  className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-xs sm:text-sm font-semibold transition-colors ${active ? "bg-[#eaf1dc] text-[#64852c]" : "text-[#62666d] hover:bg-[#f7f7f7] hover:text-[#252525]"}`}
  >
  <Icon className="size-4" /> {label}
  </Link>
  );
  })}
  </nav>
  );
}
