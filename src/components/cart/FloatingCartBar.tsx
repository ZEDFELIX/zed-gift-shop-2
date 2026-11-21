"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { formatKES } from "@/lib/utils";
type CartSummary = { count: number; subtotal: number; total?: number };
export function FloatingCartBar() {
  const [cart, setCart] = useState<CartSummary>({ count: 0, subtotal: 0 });
  const [ready, setReady] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/cart", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json() as { cart?: CartSummary };
      setCart(data.cart ?? { count: 0, subtotal: 0 });
      setReady(true);
    } catch { /* Preserve existing cart actions while offline. */ }
  }, []);
  useEffect(() => {
    void refresh();
    const update = () => { void refresh(); };
    window.addEventListener("zed:cart-updated", update);
    window.addEventListener("zed:open-cart", update);
    return () => {
      window.removeEventListener("zed:cart-updated", update);
      window.removeEventListener("zed:open-cart", update);
    };
  }, [refresh]);
  if (!ready || cart.count < 1) return null;
  return <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.7rem+env(safe-area-inset-bottom))] z-[65] px-3 lg:bottom-5 lg:left-auto lg:right-6 lg:w-[min(420px,calc(100vw-3rem))]">
    <Link href="/cart" className="pointer-events-auto flex min-h-[58px] items-center gap-3 rounded-2xl border border-white/50 bg-[var(--zed-brand-primary)] px-4 py-3 text-white shadow-[0_14px_36px_-12px_rgba(74,31,66,.55)] backdrop-blur-2xl transition hover:-translate-y-0.5">
      <span className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-white/15"><ShoppingBag className="size-5" /><span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-white px-1 text-[9px] font-extrabold text-[var(--zed-brand-primary)]">{cart.count}</span></span>
      <span className="min-w-0 flex-1"><span className="block text-[11px] font-semibold text-white/75">View your cart</span><span className="block truncate text-sm font-bold">{cart.count} {cart.count === 1 ? "item" : "items"}</span></span>
      <span className="text-right"><span className="block text-[9px] font-medium text-white/75">Cart total</span><span className="block text-sm font-extrabold">{formatKES(cart.total ?? cart.subtotal)}</span></span>
      <ArrowRight className="size-4 shrink-0" />
    </Link>
  </div>;
}
