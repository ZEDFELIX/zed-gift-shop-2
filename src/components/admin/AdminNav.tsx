"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Boxes, CreditCard, Gift, LayoutDashboard, MapPin, Package, Settings, Star, Truck, Users } from "lucide-react";

const TABS = [
 { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
 { href: "/admin/orders", label: "Orders", icon: Package },
 { href: "/admin/products", label: "Products", icon: Gift },
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
 <nav className="flex gap-1 overflow-x-auto rounded-zed border border-edge bg-white p-1.5 lg:flex-col lg:overflow-visible">
 {TABS.map(({ href, label, icon: Icon }) => {
 if (href === "/account") {
 return (
 <Link key={href} href={href} className="flex shrink-0 items-center gap-2 rounded-zed px-4 py-2.5 text-sm font-semibold text-[#334155] hover:bg-panel lg:mt-2">
 <Icon className="size-4" /> {label}
 </Link>
 );
 }
 const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
 return (
 <Link
 key={href}
 href={href}
 className={`flex shrink-0 items-center gap-2 rounded-zed px-4 py-2.5 text-sm font-semibold transition-colors ${active ? "bg-zed-950 text-white" : "text-[#07111F] hover:bg-panel hover:text-[#07111F]"}`}
 >
 <Icon className="size-4" /> {label}
 </Link>
 );
 })}
 </nav>
 );
}