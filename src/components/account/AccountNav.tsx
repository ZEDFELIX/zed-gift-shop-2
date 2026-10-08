"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, House, MapPin, Package, Settings } from "lucide-react";

const TABS = [
 { href: "/account", label: "Overview", icon: House },
 { href: "/account/orders", label: "Orders", icon: Package },
 { href: "/account/addresses", label: "Addresses", icon: MapPin },
 { href: "/account/reminders", label: "Occasion reminders", icon: Bell },
 { href: "/account/settings", label: "Settings", icon: Settings },
];

export function AccountNav() {
 const pathname = usePathname();
 return (
 <nav className="glass-nav flex gap-1 overflow-x-auto rounded-zed p-1.5 lg:flex-col lg:overflow-visible">
 {TABS.map(({ href, label, icon: Icon }) => {
 const active = pathname === href || (href !== "/account" && pathname.startsWith(href));
 return (
 <Link
 key={href}
 href={href}
 className={`flex shrink-0 items-center gap-2 rounded-zed px-4 py-2.5 text-xs sm:text-sm font-semibold transition-colors ${active ? "bg-zed-950 text-white" : "text-[#07111F] hover:bg-white/50 hover:text-[#07111F]"}`}
 >
 <Icon className="size-4" /> {label}
 </Link>
 );
 })}
 </nav>
 );
}