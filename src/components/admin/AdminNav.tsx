"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { BarChart3, Boxes, Building2, CreditCard, Database, Gift, LayoutDashboard, MapPin, Newspaper, Package, Palette, Quote, Ribbon, RotateCcw, ScrollText, Settings, ShieldCheck, Star, Truck, UserRound, Users, Tags, Zap, Menu, X, Layers, Bell } from "lucide-react";

const TABS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, adminOnly: false },
  { href: "/admin/products", label: "Products", icon: Gift, adminOnly: true },
  { href: "/admin/categories", label: "Categories", icon: Tags, adminOnly: true },
  { href: "/admin/collections", label: "Collections", icon: Layers, adminOnly: true },
  { href: "/admin/orders", label: "Orders", icon: Package, adminOnly: false },
  { href: "/admin/notifications", label: "Notifications", icon: Bell, adminOnly: false },
  { href: "/admin/customers", label: "Customers", icon: UserRound, adminOnly: false },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes, adminOnly: false },
  { href: "/admin/flash-sale", label: "Flash sales", icon: Zap, adminOnly: true },
  { href: "/admin/coupons", label: "Promotions & coupons", icon: CreditCard, adminOnly: true },
  { href: "/admin/gift-wrap", label: "Gift wrapping", icon: Ribbon, adminOnly: true },
  { href: "/admin/reviews", label: "Reviews", icon: Star, adminOnly: false },
  { href: "/admin/returns", label: "Returns & refunds", icon: RotateCcw, adminOnly: true },
  { href: "/admin/analytics", label: "Reports & analytics", icon: BarChart3, adminOnly: true },
  { href: "/admin/staff", label: "Staff & permissions", icon: Users, adminOnly: true },
  { href: "/admin/colors", label: "Brand settings", icon: Palette, adminOnly: true },
  { href: "/admin/settings", label: "Homepage banners & website settings", icon: Settings, adminOnly: true },
  { href: "/admin/deliveries", label: "Delivery settings", icon: Truck, adminOnly: true },
  { href: "/admin/testimonials", label: "Testimonials", icon: Quote, adminOnly: true },
  { href: "/admin/wholesale", label: "Wholesale", icon: Building2, adminOnly: true },
  { href: "/admin/blog", label: "Blog", icon: Newspaper, adminOnly: true },
  { href: "/admin/audit-logs", label: "Activity & audit logs", icon: ScrollText, adminOnly: true },
  { href: "/admin/security", label: "Security", icon: ShieldCheck, adminOnly: true },
  { href: "/admin/backups", label: "Backup & recovery", icon: Database, adminOnly: true },
  { href: "/account", label: "Back to storefront", icon: MapPin, adminOnly: false },
];

export function AdminNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const tabs = TABS.filter((t) => isAdmin || !t.adminOnly);
  const isActive = (href: string) => href === "/account"
    ? false
    : href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const links = (compact = false) => tabs.map(({ href, label, icon: Icon }) => {
    const active = isActive(href);
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={`group flex min-h-10 min-w-0 items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors ${active ? "zed-admin-nav-active" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"} ${href === "/account" ? "mt-2 border-t border-slate-100 pt-3" : ""}`}
      >
        <Icon className="size-[17px] shrink-0" />
        <span className={compact ? "" : "truncate"}>{label}</span>
      </Link>
    );
  });

  return (
    <>
      <details className="zed-admin-mobile-nav group lg:hidden">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2"><Menu className="size-4" /> Admin navigation</span>
          <span className="group-open:hidden"><Menu className="size-4" /></span>
          <span className="hidden group-open:block"><X className="size-4" /></span>
        </summary>
        <nav aria-label="Admin navigation" className="mt-2 grid max-h-[65vh] grid-cols-2 gap-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 sm:grid-cols-3">
          {links(true)}
        </nav>
      </details>
      <aside className="hidden lg:sticky lg:top-5 lg:block">
        <nav aria-label="Admin navigation" className="max-h-[calc(100vh-2.5rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_8px_28px_-24px_rgba(15,23,42,.35)]">
          <p className="px-3 pb-2 pt-3 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Workspace</p>
          <div className="space-y-0.5">{links()}</div>
        </nav>
      </aside>
    </>
  );
}
