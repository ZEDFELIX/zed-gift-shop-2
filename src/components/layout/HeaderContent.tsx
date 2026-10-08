"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  Clock,
  Heart,
  LogIn,
  Menu,
  Phone,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import {
  CATEGORY_STRIP,
  NAV_GROUPS,
  PLAIN_NAV,
  SITE,
  type NavChild,
  type NavColumn,
  type NavGroup,
} from "@/lib/constants";
import { formatKES } from "@/lib/utils";
import type { NavFeaturedMap, MenuFeatured } from "@/lib/data/storefront";
import { SearchPanel } from "@/components/search/SearchPanel";
import { DownloadAppButton } from "@/components/layout/DownloadAppButton";

function openCart() {
  window.dispatchEvent(new CustomEvent("zed:open-cart"));
}

function Brand({ storeName }: { storeName: string }) {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2" aria-label={`${storeName} home`}>
      <span className="grid size-8 place-items-center rounded-md bg-deep-olive font-display text-[13px] font-black text-white sm:size-10 sm:text-sm">
        Z2
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-base font-black tracking-[0.04em] text-[var(--color-ink)] sm:text-lg">
          {storeName}
        </span>
        <span className="mt-0.5 text-[9px] font-bold tracking-[0.36em] text-soft-sage">GIFT SHOP</span>
      </span>
    </Link>
  );
}

export function HeaderContent({
  cartCount,
  cartSubtotal,
  wishlistCount,
  announcement,
  contactPhone,
  storeName,
  isAuthed,
  userRole,
  featured,
}: {
  cartCount: number;
  cartSubtotal: number;
  wishlistCount: number;
  announcement: string;
  contactPhone: string;
  storeName: string;
  isAuthed: boolean;
  userRole: "CUSTOMER" | "STAFF" | "ADMIN" | null;
  featured: NavFeaturedMap;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMobileOpen(false);
    setOpenGroup(null);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setOpenGroup(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!openGroup) return;
    function onClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenGroup(null);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [openGroup]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const accountHref = isAuthed ? "/account" : "/login";

  function onHeaderSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearchQuery("");
    router.push(`/shop?q=${encodeURIComponent(q)}`);
  }

  function hoverOpen(label: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenGroup(label);
  }
  function hoverClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenGroup(null), 140);
  }

  const isActive = (href: string) => {
    const base = href.split("?")[0];
    return pathname === base || (base !== "/" && pathname.startsWith(base));
  };

  return (
    <>
      {/* Utility bar — call us + same day delivery */}
      <div className="relative z-30 hidden border-b border-zed-900/15 bg-zed-950 text-white md:block">
        <div className="container-zed flex h-9 items-center justify-between gap-4 text-[12px]">
          <a href={`tel:${contactPhone.replace(/\s+/g, "")}`} className="flex items-center gap-1.5 font-medium text-white/90 hover:text-white">
            <Phone className="size-3.5" />
            Call us on: {contactPhone} to place your order.
          </a>
          <p className="flex items-center gap-1.5 truncate font-medium text-white/70">
            <Clock className="size-3.5" />
            {announcement}
          </p>
        </div>
      </div>

      {/* Main header row */}
      <div className="sticky top-0 z-40 px-2 pt-2 sm:px-3 lg:px-5"><div className="zed-glass-nav rounded-2xl">
        <div className="container-zed flex h-[60px] items-center gap-2.5 px-4 lg:h-[74px] lg:gap-6 lg:px-10">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="grid size-11 shrink-0 place-items-center rounded-md text-[var(--color-ink)] hover:bg-zed-900/5 lg:hidden"
          >
            <Menu className="size-5" />
          </button>

          <Brand storeName={storeName} />

          <form
            role="search"
            onSubmit={onHeaderSearch}
            className="hidden min-w-0 flex-1 items-center gap-2 rounded-md border border-edge bg-panel/60 px-3.5 transition-colors focus-within:border-deep-olive focus-within:bg-white md:flex lg:max-w-xl"
          >
            <Search className="size-4 shrink-0 text-soft-sage" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              type="search"
              placeholder="Search for products..."
              aria-label="Products search"
              className="w-full min-w-0 bg-transparent py-2.5 text-sm text-[var(--color-ink)] outline-none placeholder:text-charcoal/40"
            />
          </form>

          <div className="ml-auto flex items-center gap-1 lg:gap-2">
            <a
              href={`tel:${contactPhone.replace(/\s+/g, "")}`}
              className="hidden items-center gap-2 rounded-md px-2.5 py-2 text-[13px] font-semibold text-[var(--color-ink)] hover:bg-zed-900/5 xl:flex"
            >
              <Phone className="size-4 text-soft-sage" />
              {contactPhone}
            </a>
            <Link
              href={accountHref}
              className="flex items-center gap-2 rounded-md px-2.5 py-2 text-[13px] font-semibold text-[var(--color-ink)] hover:bg-zed-900/5"
            >
              {isAuthed ? <User className="size-4 text-soft-sage" /> : <LogIn className="size-4 text-soft-sage" />}
              <span className="hidden sm:inline">{isAuthed ? "My Account" : "My Account"}</span>
            </Link>
            <Link
              href="/wishlist"
              aria-label={`Wishlist (${wishlistCount})`}
              className="relative hidden size-10 place-items-center rounded-md text-[var(--color-ink)] hover:bg-zed-900/5 sm:grid"
            >
              <Heart className="size-5" />
              {wishlistCount > 0 && (
                <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-deep-olive px-1 text-[10px] font-bold text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="grid size-11 place-items-center rounded-md text-[var(--color-ink)] hover:bg-zed-900/5 md:hidden"
            >
              <Search className="size-[22px] shrink-0 text-soft-sage" />
            </button>
            <button
              type="button"
              onClick={openCart}
              aria-label={`Cart, ${cartCount} items`}
              className="flex items-center gap-2 rounded-md bg-deep-olive px-3 py-2.5 text-white transition-colors hover:bg-zed-900"
            >
              <ShoppingBag className="size-5" />
              <span className="hidden text-[13px] font-semibold sm:inline">
                {cartSubtotal > 0
                  ? `${SITE.currencyPrefix}${cartSubtotal.toLocaleString("en-KE")}`
                  : `${SITE.currencyPrefix}0`}
              </span>
              <span className="grid min-w-5 place-items-center rounded-full bg-white/20 px-1 text-[11px] font-bold">
                {cartCount}
              </span>
            </button>
          </div>
        </div>
      </div></div>

      {/* Primary nav with mega menus */}
      <div className="relative z-30 hidden border-b border-edge bg-white lg:block" ref={navRef}>
        <div className="container-zed">
          <nav className="flex items-center" aria-label="Primary">
            {NAV_GROUPS.map((group) => (
              <div
                key={group.label}
                className="relative"
                onMouseEnter={() => hoverOpen(group.label)}
                onMouseLeave={hoverClose}
              >
                <Link
                  href={group.href}
                  onFocus={() => hoverOpen(group.label)}
                  className={`flex items-center gap-1 border-b-2 px-3.5 py-3.5 text-[14px] font-semibold transition-colors ${
                    isActive(group.href)
                      ? "border-deep-olive text-deep-olive"
                      : "border-transparent text-[var(--color-ink)] hover:text-soft-sage"
                  }`}
                >
                  {group.label}
                  <ChevronDown className="size-3.5 opacity-60" aria-hidden />
                </Link>
                {openGroup === group.label && (
                  <MegaPanel group={group} featured={featured[group.label] ?? null} />
                )}
              </div>
            ))}
            {PLAIN_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`border-b-2 px-3.5 py-3.5 text-[14px] font-semibold transition-colors ${
                  isActive(item.href)
                    ? "border-deep-olive text-deep-olive"
                    : "border-transparent text-[var(--color-ink)] hover:text-soft-sage"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile information bar */}
      <div className="lg:hidden border-y border-edge/60 bg-zed-950 text-white">
        <div className="flex items-center gap-3 overflow-x-auto px-3 py-2 text-[11px] font-medium no-scrollbar">
          <a href={"tel:" + contactPhone.replace(/\s+/g, "")} className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
            <Phone className="size-3.5 text-white/80" /> Call {contactPhone}
          </a>
          <span className="h-3.5 w-px shrink-0 bg-white/20" />
          <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-white/80">
            <Clock className="size-3.5" /> {announcement}
          </span>
          <span className="h-3.5 w-px shrink-0 bg-white/20" />
          <DownloadAppButton className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-3 py-1.5 font-bold text-zed-950" />
        </div>
      </div>

      {/* Category quick strip — horizontal scroller on mobile */}
      <div className="no-scrollbar flex items-center gap-2.5 overflow-x-auto border-t border-edge/60 bg-white/55 py-2 backdrop-blur-xl lg:hidden">
          {CATEGORY_STRIP.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="shrink-0 rounded-2xl border border-white/60 bg-white/70 px-3.5 py-2.5 text-[13px] font-medium text-[var(--color-ink)] shadow-glass transition-colors hover:bg-white"
            >
              {c.label}
            </Link>
          ))}
        </div>

      {/* Category quick strip — desktop */}
      <div className="hidden border-b border-edge bg-white/55 backdrop-blur-xl lg:block">
          <div className="container-zed flex items-center gap-1 py-2">
            <span className="mr-2 shrink-0 text-[12px] font-bold uppercase tracking-[0.14em] text-soft-sage">
              Product Categories
            </span>
            {CATEGORY_STRIP.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="rounded-md px-2.5 py-1.5 text-[13px] font-medium text-[var(--color-ink)] transition-colors hover:bg-white hover:text-soft-sage"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[75] lg:hidden">
          <div
            className="absolute inset-0 bg-zed-950/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <div className="glass-strong absolute inset-y-0 left-0 flex w-[min(90vw,360px)] flex-col shadow-glass-lg">
            <div className="flex items-center justify-between border-b border-edge px-4 py-4">
              <Brand storeName={storeName} />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="grid size-9 place-items-center rounded-md hover:bg-zed-900/5"
              >
                <X className="size-5" />
              </button>
            </div>
            <form
              role="search"
              onSubmit={(e) => {
                onHeaderSearch(e);
                setMobileOpen(false);
              }}
              className="mx-3 mt-3 flex items-center gap-2 rounded-md border border-edge bg-panel/60 px-3"
            >
              <Search className="size-4 shrink-0 text-soft-sage" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                type="search"
                placeholder="Search for products..."
                aria-label="Products search"
                className="w-full min-w-0 bg-transparent py-2.5 text-sm outline-none"
              />
            </form>
            <nav className="flex-1 overflow-y-auto p-3" aria-label="Mobile">
              {NAV_GROUPS.map((group) => (
                <MobileGroup key={group.label} group={group} onClose={() => setMobileOpen(false)} />
              ))}
              <div className="mt-3 border-t border-edge pt-2">
                {PLAIN_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-md px-3 py-2.5 text-sm font-medium text-[var(--color-ink)] hover:bg-panel"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>
            <div className="border-t border-edge p-3">
              <a
                href={`tel:${contactPhone.replace(/\s+/g, "")}`}
                className="mb-2 flex items-center justify-center gap-2 rounded-md border border-edge px-4 py-3 text-sm font-semibold"
              >
                <Phone className="size-4 text-soft-sage" /> {contactPhone}
              </a>
              <DownloadAppButton className="mb-2 flex w-full items-center justify-center gap-2 rounded-md border border-edge px-4 py-3 text-sm font-semibold text-[var(--color-ink)]" />
              {isAuthed && (userRole === "ADMIN" || userRole === "STAFF") && (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="mb-2 block rounded-md bg-zed-950 px-4 py-3 text-center text-sm font-semibold text-white"
                >
                  Admin dashboard
                </Link>
              )}
              <Link
                href={accountHref}
                onClick={() => setMobileOpen(false)}
                className="block rounded-md bg-deep-olive px-4 py-3 text-center text-sm font-semibold text-white"
              >
                {isAuthed ? "My Account" : "Sign in / Create account"}
              </Link>
            </div>
          </div>
        </div>
      )}

      <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />

      <nav aria-label="Mobile quick navigation" className="fixed inset-x-3 bottom-3 z-[60] grid grid-cols-4 rounded-2xl border border-edge bg-white p-1.5 shadow-glass-lg lg:hidden">
        <Link href="/shop" className="flex flex-col items-center gap-0.5 px-2 py-2 text-[10px] font-semibold text-ink hover:text-rose-600"><ShoppingBag className="size-4" /><span>Shop</span></Link>
        <button type="button" onClick={() => setSearchOpen(true)} className="flex flex-col items-center gap-0.5 px-2 py-2 text-[10px] font-semibold text-ink hover:text-rose-600"><Search className="size-4" /><span>Search</span></button>
        <Link href="/wishlist" className="flex flex-col items-center gap-0.5 px-2 py-2 text-[10px] font-semibold text-ink hover:text-rose-600"><Heart className="size-4" /><span>Wishlist</span></Link>
        <button type="button" onClick={openCart} className="relative flex flex-col items-center gap-0.5 px-2 py-2 text-[10px] font-semibold text-ink hover:text-rose-600"><ShoppingBag className="size-4" /><span>Cart</span>{cartCount > 0 && <span className="absolute right-3 top-1 grid min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[8px] text-white">{cartCount}</span>}</button>
      </nav>
    </>
  );
}

function MegaPanel({ group, featured }: { group: NavGroup; featured: MenuFeatured | null }) {
  return (
    <div
      className="absolute left-1/2 top-full z-50 w-[min(1180px,96vw)] -translate-x-1/2 pt-2.5 animate-fade-in"
      onMouseEnter={() => {}}
    >
      <div className="glass-strong overflow-hidden rounded-[1.5rem] shadow-glass-lg">
        <div className="grid gap-6 p-6 lg:grid-cols-5">
          <div className="grid gap-6 sm:grid-cols-2 lg:col-span-4 xl:grid-cols-4">
            {group.columns.map((col) => (
              <MenuColumn key={col.title} column={col} />
            ))}
          </div>
          <div className="lg:col-span-1">
            {featured ? (
              <Link
                href={`/product/${featured.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-xl border border-edge bg-panel/40 transition-colors hover:border-champagne"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-panel">
                  {featured.image && (
                    <Image
                      src={featured.image}
                      alt={featured.alt}
                      fill
                      unoptimized
                      sizes="240px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  {featured.sale != null && featured.sale > 0 && (
                    <span className="absolute left-2 top-2 rounded-full bg-deep-olive px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      Sale! -{featured.sale}%
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <p className="text-sm font-semibold leading-snug text-[var(--color-ink)]">{featured.name}</p>
                  <p className="text-sm font-bold text-soft-sage">
                    {formatKES(featured.price)}
                    {featured.compareAt != null && featured.compareAt > featured.price && (
                      <span className="ml-1.5 text-xs font-medium text-charcoal/50 line-through">
                        {formatKES(featured.compareAt)}
                      </span>
                    )}
                  </p>
                </div>
              </Link>
            ) : (
              <div className="flex h-full flex-col justify-center rounded-xl border border-dashed border-edge bg-panel/30 p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-soft-sage">Featured</p>
                <Link
                  href={group.href}
                  className="mt-2 text-sm font-semibold text-deep-olive hover:underline"
                >
                  Browse {group.label}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuColumn({ column }: { column: NavColumn }) {
  return (
    <div>
      {column.href ? (
        <Link
          href={column.href}
          className="text-[12px] font-bold uppercase tracking-[0.14em] text-soft-sage hover:text-deep-olive"
        >
          {column.title}
        </Link>
      ) : (
        <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-soft-sage">{column.title}</p>
      )}
      <ul className="mt-3 space-y-1">
        {column.children.map((child) => (
          <li key={child.href + child.label}>
            <Link
              href={child.href}
              className="block text-[13px] leading-relaxed text-[var(--color-ink)] transition-colors hover:text-soft-sage"
            >
              {child.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MobileGroup({ group, onClose }: { group: NavGroup; onClose: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-edge/60 last:border-0">
      <div className="flex items-center">
        <Link
          href={group.href}
          onClick={onClose}
          className="flex-1 px-3 py-3 text-[15px] font-bold text-[var(--color-ink)]"
        >
          {group.label}
        </Link>
        <button
          type="button"
          aria-label={`Toggle ${group.label} subcategories`}
          onClick={() => setOpen((v) => !v)}
          className="grid size-10 place-items-center text-soft-sage"
        >
          <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {open && (
        <div className="space-y-3 px-3 pb-3">
          {group.columns.map((col) => (
            <div key={col.title}>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-soft-sage">{col.title}</p>
              <div className="mt-1.5 grid grid-cols-2 gap-x-2">
                {col.children.map((child) => (
                  <Link
                    key={child.href + child.label}
                    href={child.href}
                    onClick={onClose}
                    className="py-1 text-[13px] text-[var(--color-ink)]"
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export type { NavChild };
