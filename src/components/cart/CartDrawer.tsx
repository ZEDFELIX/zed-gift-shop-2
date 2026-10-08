"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Gift, Minus, Plus, Trash2, X } from "lucide-react";
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
            className="absolute inset-0 bg-charcoal/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            className="zed-glass-cart fixed inset-y-0 right-0 flex h-dvh w-[min(94vw,430px)] max-w-md flex-col overflow-hidden border-l border-white/70 bg-white/55 shadow-[-24px_0_70px_-35px_rgba(42,31,45,.38)] backdrop-blur-3xl transform transition-transform duration-300 ease-in-out sm:static sm:shadow-2xl"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-white/70 bg-white/45 px-4 py-4 backdrop-blur-2xl sm:px-5">
              <h2 className="font-display text-lg font-bold text-charcoal">
                Your Cart{cart && cart.count > 0 ? ` (${cart.count})` : ""}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-charcoal/5"
              >
                <X className="size-5" />
              </button>
            </header>

            {!cart || cart.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
                <span className="grid size-16 place-items-center rounded-full bg-rose-100">
                  <Gift className="size-7" />
                </span>
                <div>
                  <p className="font-display text-lg font-bold text-charcoal">Your cart is empty</p>
                  <p className="mt-1 text-sm text-charcoal/500">Find a gift that says more.</p>
                </div>
                <Link
                  href="/shop"
                  onClick={() => setOpen(false)}
                  className="rounded-xl bg-rose-500 px-6 py-3 text-sm font-semibold text-white uppercase tracking-wider hover:bg-rose-600"
                >
                  Browse gifts
                </Link>
              </div>
            ) : (
              <>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-5 sm:py-4">
                  {cart.items.map((item) => (
                    <div
                      key={item.id}
                      className="glass-card rounded-2xl p-3 border border-white/70 bg-white/45 hover:border-white/90 transition-all mb-3"
                    >
                      <div className="flex gap-3">
                        <Link
                          href={`/product/${item.slug}`}
                          className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-white/45 ring-1 ring-white/70"
        >
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              sizes="80px"
                              unoptimized
                              className="object-cover"
                            />
                          ) : (
                            <span className="grid size-full place-items-center text-rose-400">
                              <Gift className="size-6" />
                            </span>
                          )}
                        </Link>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              href={`/product/${item.slug}`}
                              className="text-sm font-semibold leading-snug text-charcoal hover:text-rose-600"
                            >
                              {item.name}
                            </Link>
                            <button
                              type="button"
                              aria-label="Remove"
                              onClick={() => removeItem(item.id)}
                              className="size-10 rounded-full bg-charcoal/10 text-charcoal/40 hover:bg-charcoal hover:text-charcoal"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                          <div className="mt-1 text-xs text-charcoal/500">
                            {item.personalization && <span className="ml-1 italic">| Personalized</span>}
                            {item.giftWrapPrice > 0 && <span className="ml-1">| Gift box +{formatKES(item.giftWrapPrice)}</span>}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center rounded-full border border-white/80 bg-white/55 backdrop-blur-xl shadow-inner">
                            <button
                              type="button"
                              aria-label="Decrease"
                              onClick={() => changeQty(item, -1)}
                              className="grid size-10 place-items-center rounded-sm hover:bg-charcoal/10"
                            >
                              <Minus className="size-3" />
                            </button>
                            <span className="mx-2 w-6 text-center text-sm font-semibold">{item.quantity}</span>
                            <button
                              type="button"
                              aria-label="Increase"
                              onClick={() => changeQty(item, 1)}
                              className="grid size-10 place-items-center rounded-sm hover:bg-charcoal/10"
                            >
                              <Plus className="size-3" />
                            </button>
                          </div>
                          <div className="text-right">
                            {item.compareAt != null && item.compareAt > item.price && (
                              <p className="text-[10px] text-charcoal/40 line-through">
                                {formatKES(item.compareAt)}
                              </p>
                            )}
                            <p className="text-sm font-bold text-charcoal">
                              {formatKES(item.lineTotal)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Coupon */}
                <div className="shrink-0 border-t border-white/60 bg-white/45 px-3 py-3 backdrop-blur-2xl sm:px-5">
                  {cart.couponCode ? (
                    <div
                      className="flex items-center justify-between rounded-xl border border-charcoal/20 bg-white/80 px-3 py-2 text-sm backdrop-blur-sm"
                    >
                      <span className="font-semibold text-charcoal">
                        Coupon {cart.couponCode} | -{formatKES(cart.discount)}
                      </span>
                      <button
                        type="button"
                        onClick={clearCoupon}
                        className="text-xs text-charcoal/40 underline hover:text-charcoal"
                      >
                        remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={applyCoupon} className="flex gap-2">
                      <input
                        value={coupon}
                        onChange={(e) => setCoupon(e.target.value)}
                        placeholder="Coupon code"
                        className="field min-w-0 flex-1 text-sm uppercase border border-charcoal/20 rounded-xl bg-white/20 px-3 py-2.5"
                        aria-label="Coupon code"
                      />
                      <button
                        type="submit"
                        disabled={!coupon.trim()}
                        className="shrink-0 rounded-xl bg-rose-500 px-4 py-2.5 text-xs font-bold text-white uppercase tracking-wider"
                      >
                        Apply
                      </button>
                    </form>
                  )}
                  {cart.couponInvalid && (
                    <p className="mt-1.5 text-xs text-rose-500">That coupon is invalid or expired.</p>
                  )}
                </div>
                {/* Footer */}
                <footer className="shrink-0 border-t border-white/70 bg-white/65 px-4 py-4 backdrop-blur-3xl sm:px-5 sm:py-4">
                  <dl className="space-y-1.5 text-sm text-charcoal/60">
                    <div className="flex justify-between">
                      <dt>Subtotal</dt>
                      <dd>{formatKES(cart.subtotal)}</dd>
                    </div>
                    {cart.discount > 0 && (
                      <div className="flex justify-between font-semibold text-rose-600">
                        <dt>Discount</dt>
                        <dd>-{formatKES(cart.discount)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-charcoal/10 pt-2 text-base font-bold text-charcoal">
                      <dt>Total</dt>
                      <dd>{formatKES(cart.total)}</dd>
                    </div>
                    <p className="mt-1 text-[10px] text-charcoal/400">Delivery calculated at checkout.</p>
                    <Link
                      href="/checkout"
                      onClick={() => setOpen(false)}
                      className={`mt-3 block rounded-xl py-3.5 text-center text-sm font-bold transition-colors ${checkoutEnabled ? "bg-rose-500 text-white shadow-glass hover:bg-rose-600 hover:text-white" : "cursor-not-allowed bg-white/20 text-charcoal/40"}`}
                      aria-disabled={!checkoutEnabled}
                    >
                      Checkout | M-PESA
                    </Link>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="mt-2 w-full text-center text-xs text-charcoal/400 underline-offset-2 hover:underline"
                    >
                      Continue shopping
                    </button>
                  </dl>
                </footer>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}