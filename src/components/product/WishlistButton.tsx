"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";

export function WishlistButton({ productId, initialInWishlist = false }: { productId: string; initialInWishlist?: boolean }) {
 const [inWishlist, setInWishlist] = useState(initialInWishlist);
 const [busy, setBusy] = useState(false);
 const [popping, setPopping] = useState(false);
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
 setPopping(true);
 window.setTimeout(() => setPopping(false), 500);
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
 className={`grid size-10 place-items-center rounded-full border backdrop-blur transition-colors ${
 inWishlist
 ? "border-zed-900/60 bg-zed-950 text-white shadow-glass"
 : "border-white/55 bg-white/75 text-[#171717] hover:border-soft-sage hover:text-deep-olive"
 } ${busy ? "opacity-60" : ""}`}
 >
 <Heart className={`size-5 ${inWishlist ? "fill-current" : ""} ${popping ? "animate-[heart-pop_0.45s_cubic-bezier(0.16,1,0.3,1)]" : ""}`} />
 </button>
 );
}