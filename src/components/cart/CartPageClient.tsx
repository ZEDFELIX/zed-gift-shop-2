"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Minus, Plus, ShieldCheck, ShoppingBag, Trash2, Tag, Loader2, Gift } from "lucide-react";
import { formatKES } from "@/lib/utils";
import { showToast } from "@/lib/toast";

type CartItem = {
  id: string; slug: string; name: string; image: string | null; price: number;
  quantity: number; lineTotal: number; giftWrapPrice: number; inStock: boolean;
};
type Cart = {
  count: number; itemCount: number; items: CartItem[]; subtotal: number;
  discount: number; total: number; couponCode: string | null; couponInvalid: boolean;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store" });
  const data = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || "The request could not be completed.");
  return data;
}

export function CartPageClient() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [coupon, setCoupon] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const data = await request<{ cart?: Cart }>("/api/cart");
      setCart(data.cart ?? null);
      setError("");
      window.dispatchEvent(new CustomEvent("zed:cart-updated"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your cart.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function setQuantity(item: CartItem, quantity: number) {
    const next = Math.max(1, Math.min(99, quantity));
    if (next === item.quantity) return;
    setBusy(item.id);
    try {
      await request(`/api/cart/items/${item.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setQuantity", quantity: next }),
      });
      await refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not update quantity.", "error");
    } finally { setBusy(null); }
  }

  async function removeItem(item: CartItem) {
    setBusy(item.id);
    try {
      await request(`/api/cart/items/${item.id}`, { method: "DELETE" });
      showToast("Removed from your cart", "success");
      await refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not remove this item.", "error");
    } finally { setBusy(null); }
  }

  async function applyCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await request("/api/cart/coupon", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: coupon.trim() || null }),
      });
      setCoupon("");
      showToast("Coupon updated", "success");
      await refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not apply that coupon.", "error");
    }
  }

  async function clearCoupon() {
    try {
      await request("/api/cart/coupon", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: null }),
      });
      showToast("Coupon removed", "success");
      await refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not remove that coupon.", "error");
    }
  }

  if (loading) return <div className="container-zed max-w-5xl py-10"><div className="h-8 w-48 animate-pulse rounded-lg bg-[var(--zed-brand-primary)]/10" /><div className="mt-6 h-48 animate-pulse rounded-2xl bg-white shadow-sm" /></div>;

  if (!cart || cart.items.length === 0) return (
    <div className="container-zed max-w-3xl py-10 sm:py-14">
      <section className="rounded-[24px] border border-[var(--zed-brand-secondary)]/12 bg-white px-6 py-12 text-center shadow-sm sm:py-16">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--zed-brand-primary)_9%,white)] text-[var(--zed-brand-primary)]"><ShoppingBag className="size-7" /></span>
        <h1 className="mt-4 font-display text-2xl font-bold text-[var(--zed-text-heading)]">Your cart is waiting</h1>
        <p className="mt-2 text-sm text-[var(--zed-text-muted)]">Add something thoughtful and it will appear here.</p>
        <Link href="/shop" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--zed-brand-primary)] px-6 py-3 text-sm font-bold text-white">Explore gifts <ArrowRight className="size-4" /></Link>
      </section>
    </div>
  );

  const canCheckout = cart.items.every((item) => item.inStock);

  return (
    <div className="zed-cart-page container-zed max-w-6xl py-6 sm:py-9">
      <header className="mb-5 flex items-end justify-between gap-3">
        <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[var(--zed-brand-primary)]">Your selections</p><h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-[var(--zed-text-heading)] sm:text-3xl">Shopping cart <span className="text-base font-semibold text-[var(--zed-text-muted)]">({cart.count})</span></h1></div>
        <Link href="/shop" className="shrink-0 text-xs font-bold text-[var(--zed-brand-primary)] hover:underline">Continue shopping</Link>
      </header>
      {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-3" aria-label="Cart items">
          {cart.items.map((item) => (
            <article key={item.id} className="flex gap-3 rounded-2xl border border-[var(--zed-brand-secondary)]/12 bg-white p-3 shadow-sm sm:gap-4 sm:p-4">
              <Link href={`/product/${item.slug}`} className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-[var(--zed-brand-background)] sm:size-28">
                {item.image ? <Image src={item.image} alt={item.name} fill sizes="112px" unoptimized className="object-contain p-2" /> : <span className="grid size-full place-items-center text-xs font-bold">ZED</span>}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0"><Link href={`/product/${item.slug}`} className="line-clamp-2 text-sm font-bold text-[var(--zed-text-heading)] hover:text-[var(--zed-brand-primary)]">{item.name}</Link><p className="mt-1 text-sm font-extrabold text-[var(--zed-brand-primary)]">{formatKES(item.price)}</p></div>
                  <button type="button" disabled={busy === item.id} onClick={() => void removeItem(item)} aria-label={`Remove ${item.name}`} className="grid size-8 shrink-0 place-items-center rounded-full text-[var(--zed-text-muted)] transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"><Trash2 className="size-4" /></button>
                </div>
                <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-3">
                  <div className="inline-flex items-center rounded-full border border-[var(--zed-brand-secondary)]/15 bg-[var(--zed-brand-background)] p-1">
                    <button type="button" disabled={busy === item.id || item.quantity <= 1} onClick={() => void setQuantity(item, item.quantity - 1)} aria-label="Decrease quantity" className="grid size-7 place-items-center rounded-full text-[var(--zed-brand-secondary)] disabled:opacity-30"><Minus className="size-3.5" /></button>
                    <span className="min-w-8 text-center text-xs font-bold tabular-nums">{busy === item.id ? <Loader2 className="mx-auto size-3.5 animate-spin" /> : item.quantity}</span>
                    <button type="button" disabled={busy === item.id || item.quantity >= 99 || !item.inStock} onClick={() => void setQuantity(item, item.quantity + 1)} aria-label="Increase quantity" className="grid size-7 place-items-center rounded-full text-[var(--zed-brand-secondary)] disabled:opacity-30"><Plus className="size-3.5" /></button>
                  </div>
                  <div className="text-right"><p className="text-[10px] text-[var(--zed-text-muted)]">Item total</p><p className="text-sm font-extrabold text-[var(--zed-text-heading)]">{formatKES(item.lineTotal)}</p></div>
                </div>
                {item.giftWrapPrice > 0 && <p className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-[var(--zed-brand-primary)]"><Gift className="size-3" /> Gift wrapping: {formatKES(item.giftWrapPrice)}</p>}
                {!item.inStock && <p className="mt-2 text-[10px] font-bold text-red-600">Stock unavailable — remove this item to continue.</p>}
              </div>
            </article>
          ))}
          <Link href="/wrap-a-gift" className="inline-flex items-center gap-2 rounded-xl border border-dashed border-[var(--zed-brand-primary)]/35 bg-[color-mix(in_srgb,var(--zed-brand-primary)_5%,white)] px-4 py-3 text-xs font-bold text-[var(--zed-brand-primary)]"><Gift className="size-4" /> Personalize with gift wrapping <ArrowRight className="size-3.5" /></Link>
        </section>

        <aside className="rounded-2xl border border-[var(--zed-brand-secondary)]/12 bg-white p-4 shadow-sm sm:p-5 lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-bold text-[var(--zed-text-heading)]">Order summary</h2>
          <form onSubmit={(event) => void applyCoupon(event)} className="mt-4 flex gap-2">
            <label className="sr-only" htmlFor="cart-coupon">Discount code</label>
            <input id="cart-coupon" value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="Discount code" className="min-w-0 flex-1 rounded-xl border border-[var(--zed-brand-secondary)]/20 bg-[var(--zed-brand-background)] px-3 py-2.5 text-xs text-[var(--zed-text-body)] outline-none focus:border-[var(--zed-brand-primary)]" />
            <button type="submit" className="inline-flex items-center gap-1 rounded-xl bg-[var(--zed-brand-secondary)] px-3 py-2.5 text-xs font-bold text-white"><Tag className="size-3.5" /> Apply</button>
          </form>
          {cart.couponCode && <div className="mt-2 flex items-center justify-between rounded-lg bg-[color-mix(in_srgb,var(--zed-brand-primary)_7%,white)] px-3 py-2 text-xs"><span className="font-semibold text-[var(--zed-brand-primary)]">Code {cart.couponCode}</span><button type="button" onClick={() => void clearCoupon()} className="font-bold text-[var(--zed-text-muted)] underline">Remove</button></div>}
          {cart.couponInvalid && <p className="mt-2 text-xs text-red-600">This discount code is not valid for your cart.</p>}
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-3 text-[var(--zed-text-muted)]"><dt>Subtotal</dt><dd className="font-semibold text-[var(--zed-text-heading)]">{formatKES(cart.subtotal)}</dd></div>
            {cart.discount > 0 && <div className="flex justify-between gap-3 text-[var(--zed-brand-primary)]"><dt>Discount</dt><dd className="font-bold">−{formatKES(cart.discount)}</dd></div>}
            <div className="flex justify-between gap-3 border-t border-[var(--zed-brand-secondary)]/15 pt-3 text-base font-extrabold text-[var(--zed-text-heading)]"><dt>Total</dt><dd>{formatKES(cart.total)}</dd></div>
          </dl>
          <p className="mt-3 flex items-start gap-2 text-[10px] leading-relaxed text-[var(--zed-text-muted)]"><ShieldCheck className="mt-0.5 size-3.5 shrink-0" /> Delivery arrangements will be confirmed with you by phone or WhatsApp.</p>
          <Link href={canCheckout ? "/checkout" : "#"} aria-disabled={!canCheckout} onClick={(event) => { if (!canCheckout) event.preventDefault(); }} className={`mt-5 flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white shadow-sm transition ${canCheckout ? "bg-[var(--zed-brand-primary)] hover:opacity-90" : "cursor-not-allowed bg-slate-400"}`}>Proceed to checkout <ArrowRight className="size-4" /></Link>
        </aside>
      </div>
    </div>
  );
}
