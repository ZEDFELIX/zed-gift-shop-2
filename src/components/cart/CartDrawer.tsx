"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Gift, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { formatKES } from "@/lib/utils";
import { showToast } from "@/lib/toast";

type CartItemView = {
 id: string;
 productId: string;
 slug: string;
 name: string;
 image: string | null;
 price: number;
 compareAt: number | null;
 quantity: number;
 lineTotal: number;
 giftWrapPrice: number;
 variant: { id: string; name: string; value: string } | null;
 personalization: Record<string, unknown> | null;
 savedForLater: boolean;
 inStock: boolean;
};

type CartView = {
 id: string;
 count: number;
 itemCount: number;
 items: CartItemView[];
 subtotal: number;
 discount: number;
 total: number;
 couponCode: string | null;
 couponInvalid: boolean;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
 const res = await fetch(url, { ...init, cache: "no-store" });
 const data = (await res.json().catch(() => ({}))) as T & { error?: string };
 return data;
}

export function CartDrawer() {
 const [open, setOpen] = useState(false);
 const [cart, setCart] = useState<CartView | null>(null);
 const [loading, setLoading] = useState(false);
 const [coupon, setCoupon] = useState("");
 const [busyId, setBusyId] = useState<string | null>(null);
 const pathname = usePathname();
 const router = useRouter();

 const refreshCart = useCallback(async () => {
 setLoading(true);
 const data = await request<{ cart?: CartView }>("/api/cart");
 setCart(data.cart ?? null);
 setLoading(false);
 router.refresh();
 }, [router]);

 useEffect(() => {
 function onOpen() {
 setOpen(true);
 refreshCart();
 }
 window.addEventListener("zed:open-cart", onOpen);
 return () => window.removeEventListener("zed:open-cart", onOpen);
 }, [refreshCart]);

 useEffect(() => {
 setOpen(false);
 }, [pathname]);

 useEffect(() => {
 if (!open) return;
 function onKey(e: KeyboardEvent) {
 if (e.key === "Escape") setOpen(false);
 }
 window.addEventListener("keydown", onKey);
 document.body.style.overflow = "hidden";
 return () => {
 window.removeEventListener("keydown", onKey);
 document.body.style.overflow = "";
 };
 }, [open]);

 async function changeQty(item: CartItemView, delta: number) {
 const next = Math.max(1, Math.min(99, item.quantity + delta));
 if (next === item.quantity) return;
 setBusyId(item.id);
 await request<{ ok?: boolean }>(`/api/cart/items/${item.id}`, {
 method: "PATCH",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ action: "setQuantity", quantity: next }),
 });
 setBusyId(null);
 refreshCart();
 }

 async function removeItem(id: string) {
 setBusyId(id);
 await request(`/api/cart/items/${id}`, { method: "DELETE" });
 setBusyId(null);
 showToast("Removed from your cart");
 refreshCart();
 }

 async function applyCoupon(e: React.FormEvent) {
 e.preventDefault();
 await request("/api/cart/coupon", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ code: coupon }),
 });
 setCoupon("");
 refreshCart();
 }

 async function clearCoupon() {
 await request("/api/cart/coupon", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ code: null }),
 });
 refreshCart();
 }

 const checkoutEnabled = cart && cart.items.length > 0 && cart.items.every((i) => i.inStock);

 return (
 <>
 {open && (
 <div className="fixed inset-0 z-[70]">
 <div
 className="absolute inset-0 bg-zed-950/40 backdrop-blur-sm"
 onClick={() => setOpen(false)}
 aria-hidden
 />
 <aside
 role="dialog"
 aria-modal="true"
 aria-label="Shopping cart"
 className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-white/40 bg-warm-white/70 shadow-drawer backdrop-blur-2xl animate-[drawer_0.35s_cubic-bezier(0.16,1,0.3,1)_both]"
 >
 <header className="flex items-center justify-between border-b border-white/50 bg-white/50 px-5 py-4 backdrop-blur-sm">
 <h2 className="font-display text-lg font-bold text-[#171717]">
 Your Cart{cart && cart.count > 0 ? ` (${cart.count})` : ""}
 </h2>
 <button
 type="button"
 onClick={() => setOpen(false)}
 aria-label="Close cart"
 className="grid size-9 place-items-center rounded-full hover:bg-zed-900/5"
 >
 <X className="size-5" />
 </button>
 </header>

 {!cart || cart.items.length === 0 ? (
 <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
 <span className="grid size-16 place-items-center rounded-full bg-white/70 text-deep-olive shadow-glass">
 <ShoppingBag className="size-7" />
 </span>
 <div>
 <p className="font-display text-lg font-bold text-[#171717]">Your cart is empty</p>
 <p className="mt-1 text-sm text-[#6B6B6B]">Find a gift that says more.</p>
 </div>
 <Link
 href="/shop"
 onClick={() => setOpen(false)}
 className="rounded-zed bg-zed-950 px-6 py-3 text-sm font-semibold text-white hover:bg-zed-900"
 >
 Browse gifts
 </Link>
 </div>
 ) : (
 <>
 <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
 {(loading ? [] : cart.items).length === 0 && (
 <p className="py-6 text-center text-sm text-[#6B6B6B]">Refreshing cart...</p>
 )}
 {cart.items.map((item) => (
 <div key={item.id} className={`glass-panel rounded-2xl p-3 ${busyId === item.id ? "opacity-60" : ""}`}>
 <div className="flex gap-3">
 <Link href={`/product/${item.slug}`} className="relative block size-20 shrink-0 overflow-hidden rounded-xl bg-white/60">
 {item.image ? (
 <Image src={item.image} alt={item.name} fill sizes="80px" unoptimized className="object-cover" />
 ) : (
 <span className="grid size-full place-items-center text-soft-sage"><Gift className="size-6" /></span>
 )}
 </Link>
 <div className="min-w-0 flex-1">
 <div className="flex items-start justify-between gap-2">
 <Link href={`/product/${item.slug}`} className="text-sm font-semibold leading-snug text-[#171717] hover:text-deep-olive">
 {item.name}
 </Link>
 <button type="button" aria-label="Remove" onClick={() => removeItem(item.id)} className="grid size-7 shrink-0 place-items-center rounded-full text-[#6B6B6B] hover:bg-zed-900/5 hover:text-[#171717]">
 <Trash2 className="size-4" />
 </button>
 </div>
 <div className="mt-0.5 text-xs text-[#6B6B6B]">
 {item.variant && <span>{item.variant.value}</span>}
 {item.personalization && <span className="ml-1 italic">| Personalized</span>}
 {item.giftWrapPrice > 0 && <span className="ml-1">| Gift box +{formatKES(item.giftWrapPrice)}</span>}
 </div>
 <div className="mt-2 flex items-center justify-between">
 <div className="flex items-center rounded-full border border-white/60 bg-white/60">
 <button type="button" aria-label="Decrease" onClick={() => changeQty(item, -1)} className="grid size-7 place-items-center hover:bg-zed-900/5">
 <Minus className="size-3.5" />
 </button>
 <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
 <button type="button" aria-label="Increase" onClick={() => changeQty(item, 1)} className="grid size-7 place-items-center hover:bg-zed-900/5">
 <Plus className="size-3.5" />
 </button>
 </div>
 <div className="text-right">
 {item.compareAt != null && item.compareAt > item.price && (
 <p className="text-[11px] text-[#6B6B6B] line-through">{formatKES(item.compareAt)}</p>
 )}
 <p className="text-sm font-bold text-[#171717]">{formatKES(item.lineTotal)}</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 ))}

 {/* Coupon */}
 <div className="pt-1">
 {cart.couponCode ? (
 <div className="flex items-center justify-between rounded-2xl border border-zed-900/60 bg-white/60 px-3 py-2 text-sm backdrop-blur-sm">
 <span className="font-semibold text-[#171717]">
 Coupon {cart.couponCode} | -{formatKES(cart.discount)}
 </span>
 <button type="button" onClick={clearCoupon} className="text-xs text-[#6B6B6B] underline hover:text-[#171717]">
 remove
 </button>
 </div>
 ) : (
 <form onSubmit={applyCoupon} className="flex gap-2">
 <input
 value={coupon}
 onChange={(e) => setCoupon(e.target.value)}
 placeholder="Coupon code"
 className="field text-sm uppercase"
 aria-label="Coupon code"
 />
 <button type="submit" disabled={!coupon.trim()} className="shrink-0 rounded-zed bg-white/70 px-4 text-sm font-semibold text-deep-olive shadow-glass hover:border-soft-sage disabled:opacity-40">
 Apply
 </button>
 </form>
 )}
 {cart.couponInvalid && (
 <p className="mt-1.5 text-xs text-red-600">That coupon is invalid or expired.</p>
 )}
 </div>
 </div>

 <footer className="border-t border-white/50 bg-white/40 px-5 py-4 backdrop-blur-sm">
 <dl className="space-y-1.5 text-sm">
 <div className="flex justify-between text-[#171717]">
 <dt>Subtotal</dt>
 <dd>{formatKES(cart.subtotal)}</dd>
 </div>
 {cart.discount > 0 && (
 <div className="flex justify-between font-semibold text-deep-olive">
 <dt>Discount</dt>
 <dd>-{formatKES(cart.discount)}</dd>
 </div>
 )}
 <div className="flex justify-between border-t border-white/50 pt-2 text-base font-bold text-[#171717]">
 <dt>Total</dt>
 <dd>{formatKES(cart.total)}</dd>
 </div>
 </dl>
 <p className="mt-1 text-[11px] text-[#6B6B6B]">Delivery calculated at checkout.</p>
 <Link
 href="/checkout"
 onClick={() => setOpen(false)}
 className={`mt-3 block rounded-2xl py-3.5 text-center text-sm font-bold transition-colors ${
 checkoutEnabled ? "bg-zed-950 text-white shadow-glass hover:bg-deep-olive hover:text-white" : "cursor-not-allowed bg-white/40 text-[#6B6B6B]"
 }`}
 aria-disabled={!checkoutEnabled}
 >
 Checkout | M-PESA
 </Link>
 <button
 type="button"
 onClick={() => setOpen(false)}
 className="mt-2 w-full text-center text-xs text-[#6B6B6B] underline-offset-2 hover:underline"
 >
 Continue shopping
 </button>
 </footer>
 </>
 )}
 </aside>
 </div>
 )}
 </>
 );
}