"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, Heart, House, LayoutDashboard, MapPin, Package, Settings } from "lucide-react";

const TABS = [
  { href: "/account", label: "Overview", icon: House },
  { href: "/account/orders", label: "My orders", icon: Package },
  { href: "/account/wishlist", label: "Saved gifts", icon: Heart },
  { href: "/account/addresses", label: "My addresses", icon: MapPin },
  { href: "/account/reminders", label: "Date reminders", icon: Bell },
  { href: "/account/settings", label: "Profile settings", icon: Settings },
];

export function AccountNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const tabs = isAdmin ? [...TABS, { href: "/admin", label: "Admin panel", icon: LayoutDashboard }] : TABS;

  return (
    <nav aria-label="Account navigation" className="rounded-2xl border border-[#e5e5e5] bg-white p-2 shadow-[0_2px_8px_rgba(0,0,0,0.02)] sm:p-2.5">
      <p className="px-2 pb-2 pt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#999] lg:hidden">Account menu</p>
      <div className="grid grid-cols-2 gap-1.5 min-[520px]:grid-cols-3 lg:grid-cols-1">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/account" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-10 min-w-0 items-center gap-2 rounded-xl px-2.5 py-2 text-[10px] font-semibold transition sm:min-h-11 sm:px-3 sm:text-[11px] ${active ? "bg-[#202020] text-white" : "text-[#626262] hover:bg-[#f3f3f3] hover:text-[#171717]"}`}
            >
              <Icon className="size-4 shrink-0" />
              <span className="min-w-0 leading-tight">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
