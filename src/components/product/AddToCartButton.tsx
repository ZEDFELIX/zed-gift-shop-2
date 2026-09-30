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
}: {
 productId: string;
 variantId?: string | null;
 quantity?: number;
 label?: string;
 full?: boolean;
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

 return (
 <div>
 {full ? (
 <button
 type="button"
 onClick={add}
 disabled={busy}
 className="inline-flex w-full items-center justify-center gap-2 rounded-zed bg-zed-950 px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-[#171717] transition-colors hover:bg-zed-950 hover:text-white disabled:opacity-60"
 >
 <ShoppingBag className="size-4" />
 {busy ? "Adding..." : label}
 </button>
 ) : (
 <button
 type="button"
 onClick={add}
 disabled={busy}
 aria-label={label}
 className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-zed-950 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-zed-900 disabled:opacity-60"
 >
 <ShoppingBag className="size-4" />
 {busy ? "Adding..." : label}
 </button>
 )}
 {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
 </div>
 );
}