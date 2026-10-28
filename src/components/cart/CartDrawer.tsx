"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Gift, Minus, Plus, Trash2, X } from "lucide-react";
import { formatKES } from "@/lib/utils";
import { showToast } from "@/lib/toast";
import { CompleteTheGiftUpsell } from "@/components/cart/CompleteTheGiftUpsell";

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
  if (!res.ok) throw new Error(data.error || "The request could not be completed.");
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
    try {
      const data = await request<{ cart?: CartView }>("/api/cart");
      setCart(data.cart ?? null);
      router.refresh();
    } catch {
      showToast("We couldn't refresh your cart. Please try again.", "error");
    } finally {
      setLoading(false);
    }
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
    try {
      await request<{ ok?: boolean }>(`/api/cart/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setQuantity", quantity: next }),
      });
      await refreshCart();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Couldn't update quantity.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function removeItem(id: string) {
    setBusyId(id);
    try {
      await request(`/api/cart/items/${id}`, { method: "DELETE" });
      showToast("Removed from your cart");
      await refreshCart();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Couldn't remove this item.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function applyCoupon(e: React.FormEvent) {
    e.preventDefault();
    try {
      await request("/api/cart/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: coupon }),
      });
      setCoupon("");
      showToast("Coupon updated", "success");
      await refreshCart();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Couldn't apply that coupon.", "error");
    }
  }

  async function clearCoupon() {
    try {
      await request("/api/cart/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: null }),
      });
      showToast("Coupon removed", "success");
      await refreshCart();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Couldn't remove that coupon.", "error");
    }
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
            className="zed-glass-cart fixed inset-y-0 right-0 flex h-dvh w-[min(94vw,430px)] max-w-md flex-col overflow-hidden border-l border-white/70 bg-white/55 shadow-[-24px_0_70px_-35px_rgba(42,31,45,.38)] backdrop-blur-3xl transform transition-transform duration-300 ease-in-out"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-white/70 bg-white/45 px-4 py-4 backdrop-blur-2xl sm:px-5">
              <h2 className="font-display text-lg font-bold text-charcoal">
                Your Cart{cart && cart.count > 0 ? ` (${cart.count})` : ""}
              </h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close cart"
                className="grid size-11 place-items-center rounded-lg hover:bg-charcoal/5"
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
                  className="rounded-xl bg-zed-950 px-5 py-3 text-[13px] font-bold uppercase tracking-wider text-white hover:bg-zed-900"
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
                      className="mb-3 rounded-xl border border-[#e8e2dc] bg-white p-3"
                    >
                      <div className="flex gap-3">
                        <Link
                          href={`/product/${item.slug}`}
                          className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-[#f8f5f1]"
                        >
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              sizes="80px"
                              unoptimized
                              className="object-contain p-1"
                            />
                          ) : (
                            <span className="grid size-full place-items-center text-[#542447]">
                              <Gift className="size-6" />
                            </span>
                          )}
                        </Link>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              href={`/product/${item.slug}`}
                              className="min-w-0 text-sm font-semibold leading-snug text-[#171717] hover:text-[#542447]"
                            >
                              {item.name}
                            </Link>
                            <button
                              type="button"
                              aria-label={`Remove ${item.name} from cart`}
                              title="Remove item"
                              disabled={busyId === item.id}
                              onClick={() => removeItem(item.id)}
                              className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#e8dce5] bg-[#faf8f5] px-2.5 text-xs font-semibold text-[#542447] transition-colors hover:border-[#542447] hover:bg-[#542447] hover:text-white disabled:cursor-wait disabled:opacity-50"
                            >
                              <Trash2 className="size-3.5" aria-hidden="true" />
                              <span>Remove</span>
                            </button>
                          </div>
                          <div className="mt-1 text-xs text-[#77716f]">
                            {item.personalization && <span className="mr-1">Personalized</span>}
                            {item.giftWrapPrice > 0 && <span className="mr-1">Gift box +{formatKES(item.giftWrapPrice)}</span>}
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <div className="flex items-center rounded-lg border border-[#e8e2dc] bg-[#faf8f5]">
                              <button
                                type="button"
                                aria-label="Decrease quantity"
                                disabled={busyId === item.id}
                                onClick={() => changeQty(item, -1)}
                                className="grid size-9 place-items-center rounded-l-lg text-[#171717] hover:bg-black/5 disabled:opacity-50"
                              >
                                <Minus className="size-4" />
                              </button>
                              <span className="w-7 text-center text-sm font-semibold text-[#171717]">{item.quantity}</span>
                              <button
                                type="button"
                                aria-label="Increase quantity"
                                disabled={busyId === item.id}
                                onClick={() => changeQty(item, 1)}
                                className="grid size-9 place-items-center rounded-r-lg text-[#171717] hover:bg-black/5 disabled:opacity-50"
                              >
                                <Plus className="size-4" />
                              </button>
                            </div>
                            <div className="text-right">
                              {item.compareAt != null && item.compareAt > item.price && (
                                <p className="text-[11px] text-[#77716f] line-through">
                                  {formatKES(item.compareAt)}
                                </p>
                              )}
                              <p className="text-sm font-bold text-[#542447]">
                                {formatKES(item.lineTotal)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <CompleteTheGiftUpsell />
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
                        className="text-[11px] underline decoration-rose-300 underline-offset-2 text-rose-600 hover:text-rose-700"
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
                        className="shrink-0 rounded-xl bg-zed-950 px-4 py-2.5 text-[12px] font-bold text-white uppercase tracking-wider disabled:opacity-60"
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
                    <p className="mt-1 text-[11px] text-charcoal/400">Delivery calculated at checkout.</p>
                    <Link
                      href="/checkout"
                      onClick={() => setOpen(false)}
                      className={`mt-3 block rounded-xl px-5 py-3 text-center text-[13px] font-bold uppercase tracking-wider transition-colors disabled:opacity-60 ${checkoutEnabled ? "bg-zed-950 text-white shadow-glass hover:bg-zed-900 hover:text-white" : "cursor-not-allowed bg-white/20 text-charcoal/40"}`}
                      aria-disabled={!checkoutEnabled}
                    >
                      Checkout | M-PESA
                    </Link>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="mt-2 w-full text-center text-[12px] font-semibold text-charcoal/60 underline-offset-2 hover:text-charcoal"
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