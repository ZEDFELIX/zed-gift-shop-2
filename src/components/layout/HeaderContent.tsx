"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  Heart,
  LogIn,
  Menu,
  Phone,
  Search,
  ShieldCheck,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import {
  NAV_GROUPS,
  PLAIN_NAV,
  SITE,
  type NavGroup,
} from "@/lib/constants";
import { SearchPanel } from "@/components/search/SearchPanel";
import { DownloadAppButton } from "@/components/layout/DownloadAppButton";

function openCart() {
  window.dispatchEvent(new CustomEvent("zed:open-cart"));
}

function Brand({ storeName }: { storeName: string }) {
  return (
    <Link href="/" className="navbar-logo-container flex min-w-0 items-center" aria-label={`${storeName} home`}>
      <Image
        src="/logo.png"
        alt={storeName}
        width={522}
        height={186}
        priority
        className="navbar-logo block object-contain object-center"
      />
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
}: {
  cartCount: number;
  cartSubtotal: number;
  wishlistCount: number;
  announcement: string;
  contactPhone: string;
  storeName: string;
  isAuthed: boolean;
  userRole: "CUSTOMER" | "STAFF" | "ADMIN" | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const accountHref = isAuthed ? "/account" : "/login";

  function onHeaderSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearchQuery("");
    router.push(`/shop?q=${encodeURIComponent(q)}`);
  }

  return (
    <>
      {/* Mobile announcement bar — tall, empty, message sweeps in from the left */}
      <div className="relative z-30 border-b border-edge/60 bg-[var(--color-announcement,#6B2D5C)] text-[var(--color-announcement-fg,#fff)] lg:hidden">
        <div className="zed-announcement-wrap h-14">
          <div className="zed-announcement-track text-[12px] font-semibold sm:text-[13px]" aria-hidden="true">
            <span>{announcement}</span>
          </div>
        </div>
        <p className="sr-only">{announcement}</p>
      </div>

      {/* Desktop announcement bar — tall, empty, message sweeps in from the left */}
      <div className="relative z-30 hidden border-b border-zed-900/15 bg-[var(--color-announcement,#6B2D5C)] text-[var(--color-announcement-fg,#fff)] md:block">
        <div className="container-zed zed-announcement-wrap h-14">
          <div className="zed-announcement-track text-[13px] font-semibold" aria-hidden="true">
            <span>{announcement}</span>
          </div>
        </div>
        <p className="sr-only">{announcement}</p>
      </div>

      {/* Main header row */}
      <div className="sticky top-0 z-40 px-2 pt-1.5 sm:px-3 sm:pt-2 lg:px-5"><div className="zed-glass-nav rounded-2xl">
        <div className="container-zed flex h-[56px] items-center gap-2 px-2.5 sm:h-[60px] sm:gap-2.5 sm:px-4 lg:h-[74px] lg:gap-6 lg:px-10">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="grid size-10 shrink-0 place-items-center rounded-md text-[var(--color-ink)] hover:bg-zed-900/5 lg:hidden"
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
            {userRole === "ADMIN" && (
              <Link
                href="/admin"
                className="hidden items-center gap-2 rounded-md bg-zed-950 px-3 py-2 text-[13px] font-bold text-white transition-colors hover:bg-zed-900 sm:flex"
              >
                <ShieldCheck className="size-4" />
                <span>Admin</span>
              </Link>
            )}
            <DownloadAppButton className="hidden items-center gap-2 rounded-md border border-edge px-3 py-2 text-[13px] font-semibold text-[var(--color-ink)] hover:bg-zed-900/5 lg:flex" />
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
              className="grid size-10 place-items-center rounded-md text-[var(--color-ink)] hover:bg-zed-900/5 md:hidden"
            >
              <Search className="size-[22px] shrink-0 text-soft-sage" />
            </button>
            <button
              type="button"
              onClick={openCart}
              aria-label={`Cart, ${cartCount} items`}
              className="flex items-center gap-1.5 rounded-md bg-deep-olive px-2.5 py-2 text-white transition-colors hover:bg-zed-900 sm:gap-2 sm:px-3 sm:py-2.5"
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
              {isAuthed && userRole === "ADMIN" && (
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
        <Link href="/shop" className="flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-semibold text-ink hover:text-rose-600"><ShoppingBag className="size-4" /><span>Shop</span></Link>
        <button type="button" onClick={() => setSearchOpen(true)} className="flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-semibold text-ink hover:text-rose-600"><Search className="size-4" /><span>Search</span></button>
        <Link href="/wishlist" className="flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-semibold text-ink hover:text-rose-600"><Heart className="size-4" /><span>Wishlist</span></Link>
        <button type="button" onClick={openCart} className="relative flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-semibold text-ink hover:text-rose-600"><ShoppingBag className="size-4" /><span>Cart</span>{cartCount > 0 && <span className="absolute right-2 top-1 grid min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[8px] text-white">{cartCount}</span>}</button>
      </nav>
    </>
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
