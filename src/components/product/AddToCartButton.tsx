"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";

export function AddToCartButton({
  productId,
  variantId = null,
  quantity = 1,
  label = "Add to cart",
  full,
  variant = "solid",
}: {
  productId: string;
  variantId?: string | null;
  quantity?: number;
  label?: string;
  full?: boolean;
  variant?: "solid" | "outline";
}) {
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const router = useRouter();

 async function add() {
 if (busy) return;
 setBusy(true);
 setError(null);
 try {
 const res = await fetch("/api/cart/items", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ productId, variantId, quantity }),
 });
 const data = (await res.json()) as { ok?: boolean; error?: string };
 if (!res.ok || !data.ok) {
 setError(data.error ?? "Could not add to cart.");
 return;
 }
 window.dispatchEvent(new CustomEvent("zed:open-cart"));
 router.refresh();
 } finally {
 setBusy(false);
 }
 }

const base =
    "inline-flex w-full items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors disabled:opacity-60";
  const styles =
    variant === "outline"
      ? `${base} border border-edge bg-white text-ink hover:border-rose-400 hover:text-rose-600`
      : `${base} bg-plum-800 text-white hover:bg-plum-900`;
  const size = full ? "px-6 py-3.5 text-sm font-bold uppercase tracking-wider" : "px-4 py-2.5 text-xs font-semibold";

  return (
  <div>
  <button type="button" onClick={add} disabled={busy} aria-label={label} className={`${styles} ${size}`}>
  <ShoppingBag className="size-4" />
  {busy ? "Adding..." : label}
  </button>
  {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
  </div>
  );
}