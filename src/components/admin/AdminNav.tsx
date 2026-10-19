"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { BarChart3, Boxes, CreditCard, Gift, LayoutDashboard, MapPin, Package, Palette, Ribbon, RotateCcw, ScrollText, Settings, Star, Truck, Users, Tags, Zap } from "lucide-react";

const TABS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { href: "/admin/orders", label: "Orders", icon: Package, adminOnly: false },
  { href: "/admin/products", label: "Products", icon: Gift, adminOnly: false },
  { href: "/admin/flash-sale", label: "Flash Sale", icon: Zap, adminOnly: false },
  { href: "/admin/categories", label: "Categories", icon: Tags, adminOnly: false },
  { href: "/admin/coupons", label: "Coupons", icon: CreditCard, adminOnly: false },
  { href: "/admin/deliveries", label: "Delivery", icon: Truck, adminOnly: false },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes, adminOnly: false },
  { href: "/admin/reviews", label: "Reviews", icon: Star, adminOnly: false },
  { href: "/admin/returns", label: "Returns", icon: RotateCcw, adminOnly: false },
  { href: "/admin/gift-wrap", label: "Gift wrap", icon: Ribbon, adminOnly: false },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, adminOnly: false },
  { href: "/admin/settings", label: "Settings", icon: Settings, adminOnly: true },
  { href: "/admin/colors", label: "Colors", icon: Palette, adminOnly: true },
  { href: "/admin/staff", label: "Staff", icon: Users, adminOnly: true },
  { href: "/admin/audit-logs", label: "Audit logs", icon: ScrollText, adminOnly: true },
  { href: "/account", label: "Back to store", icon: MapPin, adminOnly: false },
];

export function AdminNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const tabs = TABS.filter((t) => isAdmin || !t.adminOnly);
  return (
    <nav className="grid grid-cols-2 gap-1 rounded-2xl border border-charcoal/10 bg-white p-1.5 shadow-sm sm:grid-cols-3 lg:flex lg:flex-col lg:overflow-visible">
      {tabs.map(({ href, label, icon: Icon }) => {
        if (href === "/account") {
          return (
            <Link key={href} href={href} className="flex min-h-11 min-w-0 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-charcoal/60 hover:bg-panel lg:mt-2">
              <Icon className="size-4" /> {label}
            </Link>
          );
        }
        const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`flex min-h-11 min-w-0 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors ${active ? "bg-rose-50 text-rose-700" : "text-charcoal/70 hover:bg-panel hover:text-charcoal"}`}
          >
            <Icon className="size-4" /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
