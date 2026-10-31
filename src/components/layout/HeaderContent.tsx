"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  UsersRound,
  LogIn,
  Menu,
  MessageCircle,
  Phone,
  Search,
  SlidersHorizontal,
  Heart,
  Home,
  ShieldCheck,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import {
  NAV_GROUPS,
  PLAIN_NAV,
  SITE,
  UTILITY_NAV,
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
        className="navbar-logo block object-contain object-center h-8 sm:h-10 lg:h-12 w-auto"
      />
    </Link>
  );
}

export function HeaderContent({
  cartCount,
  cartSubtotal,
  announcement,
  contactPhone,
  whatsappNumber,
  storeName,
  isAuthed,
  userRole,
}: {
  cartCount: number;
  cartSubtotal: number;
  announcement: string;
  contactPhone: string;
  whatsappNumber: string;
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

  const telHref = `tel:${contactPhone.replace(/\s+/g, "")}`;
  const waHref = `https://wa.me/${whatsappNumber}`;

  return (
    <>
      {pathname.startsWith("/product/") && (
        <div className="sticky top-0 z-50 flex h-12 items-center justify-between border-b border-black/5 bg-white/95 px-4 shadow-sm backdrop-blur md:hidden">
          <Link href="/shop" aria-label="Back to shop" className="grid size-9 place-items-center rounded-full bg-black/5 text-[var(--color-ink)]"><ChevronDown className="size-5 rotate-90" /></Link>
          <span className="text-sm font-semibold text-[var(--color-ink)]">Details</span>
          <button type="button" onClick={openCart} aria-label={`Open cart, ${cartCount} items`} className="relative grid size-9 place-items-center rounded-full bg-black/5 text-[var(--color-ink)]"><ShoppingBag className="size-[18px]" />{cartCount > 0 && <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-zed-950 px-1 text-[9px] font-bold text-white">{cartCount}</span>}</button>
        </div>
      )}
      {/* Compact responsive announcement bar */}
      <div className="relative z-30 block border-b border-white/10 bg-[var(--color-announcement,#6B2D5C)] text-[var(--color-announcement-fg,#fff)]">
        <div className="container-zed flex min-h-9 items-center justify-between gap-2 px-3 sm:min-h-10 sm:px-4">
          <p className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-center text-[10px] font-semibold tracking-wide scrollbar-none touch-pan-x sm:text-xs md:overflow-hidden md:text-left md:text-ellipsis">
            {announcement}
          </p>
          <div className="flex shrink-0 items-center gap-3 border-l border-white/25 pl-3 text-[10px] font-semibold sm:gap-4 sm:pl-4 sm:text-[11px]">
            <a href={telHref} className="inline-flex items-center gap-1.5 whitespace-nowrap transition-opacity hover:opacity-75" aria-label={`Call us on ${contactPhone}`}>
              <Phone className="size-3" aria-hidden="true" />
              <span className="hidden sm:inline">{contactPhone}</span>
              <span className="sm:hidden">Call</span>
            </a>
            <a href={waHref} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 whitespace-nowrap transition-opacity hover:opacity-75" aria-label={`WhatsApp ${whatsappNumber}`}>
              <MessageCircle className="size-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">WhatsApp</span>
              <span className="sm:hidden">Chat</span>
            </a>
          </div>
        </div>
        <p className="sr-only">{announcement ? `${announcement} · ` : ""}Call us on: {contactPhone} · WhatsApp: {whatsappNumber}</p>
      </div>

      {/* Main header row */}
      <div className={`sticky top-0 z-40 px-2 pt-1.5 sm:px-3 sm:pt-2 lg:px-5 ${pathname.startsWith("/product/") ? "hidden md:block" : ""}`}><div className="zed-glass-nav rounded-2xl">
        <div className="container-zed flex h-[56px] items-center gap-2 px-2.5 sm:h-[60px] sm:gap-2.5 sm:px-4 lg:h-[74px] lg:gap-6 lg:px-10">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="grid size-9 shrink-0 place-items-center rounded-md text-[var(--color-ink)] hover:bg-zed-900/5 lg:hidden"
          >
            <Menu className="size-4" />
          </button>

          <Brand storeName={storeName} />

          <form
            role="search"
            onSubmit={onHeaderSearch}
            className="hidden min-w-0 flex-1 items-center gap-2 rounded-md border border-edge bg-panel/60 px-3 transition-colors focus-within:border-deep-olive focus-within:bg-white md:flex lg:max-w-xl"
          >
            <Search className="size-3.5 shrink-0 text-soft-sage" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              type="search"
              placeholder="Search for products..."
              aria-label="Products search"
              className="w-full min-w-0 bg-transparent py-2 text-sm text-[var(--color-ink)] outline-none placeholder:text-charcoal/40"
            />
          </form>

          <div className="ml-auto flex items-center gap-1 lg:gap-2">
            {pathname.startsWith("/shop") && (
              <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("zed:toggle-shop-filters"))} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-edge bg-white/70 px-2.5 text-[11px] font-semibold text-[var(--color-ink)] transition hover:bg-zed-900/5 sm:px-3 sm:text-xs" aria-label="Open shop filters">
                <SlidersHorizontal className="size-4" /> <span>Filters</span>
              </button>
            )}
            <a
              href={`tel:${contactPhone.replace(/\s+/g, "")}`}
              className="hidden items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-semibold text-[var(--color-ink)] hover:bg-zed-900/5 xl:flex"
            >
              <Phone className="size-3.5 text-soft-sage" />
              {contactPhone}
            </a>
            <Link
              href={accountHref}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-semibold text-[var(--color-ink)] hover:bg-zed-900/5"
            >
              {isAuthed ? <User className="size-3.5 text-soft-sage" /> : <LogIn className="size-3.5 text-soft-sage" />}
              <span className="hidden sm:inline">{isAuthed ? "My Account" : "My Account"}</span>
            </Link>
            {userRole === "ADMIN" && (
              <Link
                href="/admin"
                className="hidden items-center gap-1.5 rounded-md bg-zed-950 px-3 py-2 text-[12px] font-bold text-white transition-colors hover:bg-zed-900 sm:flex"
              >
                <ShieldCheck className="size-3.5" />
                <span>Admin</span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="grid size-9 place-items-center rounded-md text-[var(--color-ink)] hover:bg-zed-900/5 md:hidden"
            >
              <Search className="size-[20px] shrink-0 text-soft-sage" />
            </button>
            <button
              type="button"
              onClick={openCart}
              aria-label={`Cart, ${cartCount} items`}
              className="flex items-center gap-1 rounded-md bg-deep-olive px-2.5 py-2 text-white transition-colors hover:bg-zed-900 sm:gap-2 sm:px-3 sm:py-2.5"
            >
              <ShoppingBag className="size-4" />
              <span className="hidden text-[12px] font-semibold sm:inline">
                {cartSubtotal > 0
                  ? `${SITE.currencyPrefix}${cartSubtotal.toLocaleString("en-KE")}`
                  : `${SITE.currencyPrefix}0`}
              </span>
              <span className="grid min-w-4 place-items-center rounded-full bg-white/20 px-1 text-[10px] font-bold">
                {cartCount}
              </span>
            </button>
          </div>
        </div>
      </div></div>

      {/* Utility bar — key links, shown below the announcement bar on every screen */}
      <div className={`relative z-30 border-b border-edge bg-white ${pathname.startsWith("/product/") ? "hidden md:block" : ""}`}>
        <div className="container-zed flex items-center justify-end overflow-x-auto py-1.5 sm:py-2">
          <nav className="flex items-center gap-3.5 sm:gap-5" aria-label="Utility">
            {UTILITY_NAV.map((item) => (
              <Link key={item.href} href={item.href} className="whitespace-nowrap text-[12px] font-semibold text-[var(--color-ink)] transition-colors hover:text-soft-sage sm:text-[13px]">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[75] lg:hidden">
          <div
            className="absolute inset-0 bg-zed-950/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <div className="glass-strong absolute inset-y-0 left-0 flex h-dvh max-h-dvh w-[min(90vw,360px)] flex-col overflow-hidden shadow-glass-lg">
            <div className="flex items-center justify-between border-b border-edge px-4 py-4">
              <Brand storeName={storeName} />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="grid size-8 place-items-center rounded-md hover:bg-zed-900/5"
              >
                <X className="size-4" />
              </button>
            </div>
            <form
              role="search"
              onSubmit={(e) => {
                onHeaderSearch(e);
                setMobileOpen(false);
              }}
              className="mx-3 mt-3 flex items-center gap-2 rounded-md border border-edge bg-panel/60 px-2.5"
            >
              <Search className="size-3.5 shrink-0 text-soft-sage" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                type="search"
                placeholder="Search for products..."
                aria-label="Products search"
                className="w-full min-w-0 bg-transparent py-2 text-sm outline-none"
              />
            </form>
            <nav className="min-h-0 flex-1 overflow-hidden p-3" aria-label="Mobile">
              {NAV_GROUPS.map((group) => (
                <MobileGroup key={group.label} group={group} onClose={() => setMobileOpen(false)} />
              ))}
              <div className="mt-2 border-t border-edge pt-2">
                {PLAIN_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-md px-3 py-2 text-sm font-medium text-[var(--color-ink)] hover:bg-panel"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>
            <div className="shrink-0 border-t border-edge bg-white/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              <a
                href={`tel:${contactPhone.replace(/\s+/g, "")}`}
                className="mb-2 flex items-center justify-center gap-2 rounded-md border border-edge px-4 py-3 text-sm font-semibold"
              >
                <Phone className="size-4 text-soft-sage" /> {contactPhone}
              </a>
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
              <DownloadAppButton className="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-[#6B2D5C] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#542248]" />
            </div>
          </div>
        </div>
      )}

      <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />

       <nav aria-label="Mobile quick navigation" className={`fixed inset-x-3 bottom-3 z-[80] grid grid-cols-4 rounded-full border border-white/80 bg-white/90 p-1 shadow-[0_8px_28px_rgba(0,0,0,.12)] backdrop-blur-xl lg:hidden ${pathname.startsWith("/product/") ? "hidden" : ""}`}>
         <Link href="/" className="flex flex-col items-center justify-center gap-0.5 rounded-full px-1 py-1.5 text-[10px] font-semibold text-[#62666d]"><Home className="size-5" /><span>Home</span></Link>
         <button type="button" onClick={openCart} className="flex flex-col items-center justify-center gap-0.5 rounded-full px-1 py-1.5 text-[10px] font-semibold text-[#62666d]"><ShoppingBag className="size-5" /><span>Cart</span></button>
         <Link href="/account/wishlist" className="flex flex-col items-center justify-center gap-0.5 rounded-full px-1 py-1.5 text-[10px] font-semibold text-[#62666d]"><Heart className="size-5" /><span>Wishlist</span></Link>
         <Link href={accountHref} className="flex flex-col items-center justify-center gap-0.5 rounded-full px-1 py-1.5 text-[10px] font-semibold text-[#62666d]"><User className="size-5" /><span>Account</span></Link>
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
          className="grid size-9 place-items-center text-soft-sage"
        >
          <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {open && (
        <div className="space-y-2 px-2.5 pb-2">
          {group.columns.map((col) => (
            <div key={col.title}>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-soft-sage">{col.title}</p>
                <div className="mt-1 grid grid-cols-2 gap-x-1.5">
                  {col.children.map((child) => (
                    <Link
                      key={child.href + child.label}
                      href={child.href}
                      onClick={onClose}
                      className="py-1 text-[12px] text-[var(--color-ink)]"
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
