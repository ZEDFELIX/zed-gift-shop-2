"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";

export function WishlistButton({ productId, initialInWishlist = false }: { productId: string; initialInWishlist?: boolean }) {
 const [inWishlist, setInWishlist] = useState(initialInWishlist);
 const [busy, setBusy] = useState(false);
 const router = useRouter();

 async function toggle() {
  if (busy) return;
  setBusy(true);
  try {
   const res = await fetch("/api/wishlist/toggle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId }),
   });
   const data = (await res.json()) as { ok?: boolean; inWishlist?: boolean };
   const next = Boolean(data.inWishlist);
   setInWishlist(next);
   if (next) {
    showToast("Added to your wishlist");
   } else {
    showToast("Removed from your wishlist");
   }
   router.refresh();
  } catch {
   // ignore transient failures
  } finally {
   setBusy(false);
  }
 }

 return (
  <button
   type="button"
   onClick={toggle}
   aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
   aria-pressed={inWishlist}
   className={`rounded-full border border-charcoal/20 bg-white/80 backdrop-blur-sm transition-colors ${
    inWishlist
     ? "border-charcoal/30 bg-rose-100 text-rose-700 shadow-glass"
     : "border-rose-200 text-rose-400 hover:border-rose-300 hover:text-rose-600"
   } ${busy ? "opacity-60" : ""}`}
   aria-describedby="wishlist-tooltip"
   title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
  >
   <Heart
    className={`size-4 fill-rose-500 ${
     inWishlist ? "fill-current animate-[heart-beat_1s_infinite]" : ""
    }`}
   />
  </button>
 );
}