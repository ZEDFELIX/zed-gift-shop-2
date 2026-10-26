"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingBag } from "lucide-react";

export function WishlistCartButton({ productId, inStock }: { productId: string; inStock: boolean }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function addToCart() {
    if (busy || !inStock) return;
    setBusy(true);
    try {
      const response = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent("/account/wishlist")}`);
        return;
      }
      if (!response.ok) throw new Error(data.error ?? "This gift couldn't be added to your cart.");
      window.dispatchEvent(new CustomEvent("zed:open-cart"));
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Please try adding this gift again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={addToCart} disabled={busy || !inStock} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[#171717] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#542447] disabled:cursor-not-allowed disabled:bg-charcoal/25">
      {busy ? <Loader2 className="size-4 animate-spin" /> : <ShoppingBag className="size-4" />}
      {busy ? "Adding…" : inStock ? "Add to cart" : "Out of stock"}
    </button>
  );
}

export function ClearWishlistButton({ count }: { count: number }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function clear() {
    if (busy || count < 1) return;
    if (!window.confirm("Remove all saved gifts from your wishlist?")) return;
    setBusy(true);
    try {
      const response = await fetch("/api/wishlist?clear=1", { method: "DELETE" });
      if (response.status === 401) {
        router.push("/login?next=/account/wishlist");
        return;
      }
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Couldn't clear your saved gifts.");
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={clear} disabled={busy} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-black/10 bg-white/70 px-3 py-2 text-xs font-semibold text-charcoal/70 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60">
      {busy ? <><Loader2 className="mr-2 size-4 animate-spin" /> Clearing…</> : "Clear wishlist"}
    </button>
  );
}
