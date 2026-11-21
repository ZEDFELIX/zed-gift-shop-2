"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, Package, UserRound } from "lucide-react";

const items = [
  { href: "/shop", label: "Home", icon: Home, matches: (p: string) => p === "/" || p.startsWith("/shop") || p.startsWith("/product/") || p.startsWith("/gifts/") },
  { href: "/account/orders", label: "Orders", icon: Package, matches: (p: string) => p.startsWith("/account/orders") },
  { href: "/account/wishlist", label: "Favorites", icon: Heart, matches: (p: string) => p.startsWith("/account/wishlist") },
  { href: "/account", label: "Profile", icon: UserRound, matches: (p: string) => p.startsWith("/account") && !p.startsWith("/account/orders") && !p.startsWith("/account/wishlist") },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/login") || pathname.startsWith("/register")) return null;
  return (
    <nav aria-label="Main mobile navigation" className="zed-mobile-bottom-nav md:hidden">
      {items.map(({ href, label, icon: Icon, matches }) => {
        const active = matches(pathname);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined}
            className={`zed-mobile-bottom-link ${active ? "is-active" : ""}`}>
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
