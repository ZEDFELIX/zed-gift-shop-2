"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { BarChart3, Boxes, Building2, CreditCard, Gift, LayoutDashboard, MapPin, Newspaper, Package, Palette, Quote, Ribbon, RotateCcw, ScrollText, Settings, Star, Truck, UserRound, Users, Tags, Zap } from "lucide-react";

const TABS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { href: "/admin/orders", label: "Orders", icon: Package, adminOnly: false },
  { href: "/admin/customers", label: "Customers", icon: UserRound, adminOnly: false },
  { href: "/admin/products", label: "Products", icon: Gift, adminOnly: true },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes, adminOnly: false },
  { href: "/admin/reviews", label: "Reviews", icon: Star, adminOnly: false },
  { href: "/admin/returns", label: "Returns & refunds", icon: RotateCcw, adminOnly: true },
  { href: "/admin/flash-sale", label: "Flash Sale", icon: Zap, adminOnly: true },
  { href: "/admin/categories", label: "Categories", icon: Tags, adminOnly: true },
  { href: "/admin/coupons", label: "Coupons", icon: CreditCard, adminOnly: true },
  { href: "/admin/deliveries", label: "Delivery settings", icon: Truck, adminOnly: true },
  { href: "/admin/gift-wrap", label: "Gift wrap settings", icon: Ribbon, adminOnly: true },
  { href: "/admin/testimonials", label: "Testimonials", icon: Quote, adminOnly: true },
  { href: "/admin/wholesale", label: "Wholesale quotes", icon: Building2, adminOnly: true },
  { href: "/admin/blog", label: "Blog", icon: Newspaper, adminOnly: true },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, adminOnly: true },
  { href: "/admin/settings", label: "Store settings", icon: Settings, adminOnly: true },
  { href: "/admin/colors", label: "Brand colors", icon: Palette, adminOnly: true },
  { href: "/admin/staff", label: "Staff & admins", icon: Users, adminOnly: true },
  { href: "/admin/audit-logs", label: "Audit logs", icon: ScrollText, adminOnly: true },
  { href: "/account", label: "Back to store", icon: MapPin, adminOnly: false },
];

export function AdminNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const tabs = TABS.filter((t) => isAdmin || !t.adminOnly);
  return (
    <nav aria-label="Admin navigation" className="grid grid-cols-2 gap-1 rounded-2xl border border-charcoal/10 bg-white p-1.5 shadow-sm sm:grid-cols-3 lg:flex lg:flex-col lg:overflow-visible">
      {tabs.map(({ href, label, icon: Icon }) => {
        if (href === "/account") {
          return (
            <Link key={href} href={href} className="flex min-h-11 min-w-0 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-charcoal/60 hover:bg-panel lg:mt-2">
              <Icon className="size-4 shrink-0" /> <span>{label}</span>
            </Link>
          );
        }
        const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 min-w-0 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors ${active ? "bg-rose-50 text-rose-700" : "text-charcoal/70 hover:bg-panel hover:text-charcoal"}`}
          >
            <Icon className="size-4 shrink-0" /> <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
