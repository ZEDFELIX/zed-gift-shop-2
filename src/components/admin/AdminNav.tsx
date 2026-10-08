"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Boxes, CreditCard, Gift, LayoutDashboard, MapPin, Package, Settings, Star, Truck, Users, Tags } from "lucide-react";

const TABS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: Package },
  { href: "/admin/products", label: "Products", icon: Gift },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/coupons", label: "Coupons", icon: CreditCard },
  { href: "/admin/deliveries", label: "Delivery", icon: Truck },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/staff", label: "Staff", icon: Users },
  { href: "/account", label: "Back to store", icon: MapPin },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="grid grid-cols-2 gap-1 rounded-2xl border border-charcoal/10 bg-white p-1.5 shadow-sm sm:grid-cols-3 lg:flex lg:flex-col lg:overflow-visible">
      {TABS.map(({ href, label, icon: Icon }) => {
        if (href === "/account") {
          return (
            <Link key={href} href={href} className="flex min-w-0 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-charcoal/60 hover:bg-panel lg:mt-2">
              <Icon className="size-4" /> {label}
            </Link>
          );
        }
        const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`flex min-w-0 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors ${active ? "bg-rose-50 text-rose-700" : "text-charcoal/70 hover:bg-panel hover:text-charcoal"}`}
          >
            <Icon className="size-4" /> {label}
          </Link>
        );
      })}
    </nav>
  );
}