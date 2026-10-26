"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";

export function WishlistRemoveButton({ productId }: { productId: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function remove() {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/wishlist?productId=${encodeURIComponent(productId)}`, { method: "DELETE" });
      if (response.status === 401) {
        router.push("/login?next=/account/wishlist");
        return;
      }
      if (!response.ok) throw new Error("Unable to update saved gifts.");
      router.refresh();
    } catch {
      window.alert("Couldn't update your saved gifts. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={remove} disabled={busy} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-zed-950/15 px-3 py-2 text-xs font-semibold text-[#07111F] transition hover:bg-rose-50 disabled:opacity-60" aria-label="Remove from saved gifts">
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Heart className="size-4" />}
      Remove saved gift
    </button>
  );
}
