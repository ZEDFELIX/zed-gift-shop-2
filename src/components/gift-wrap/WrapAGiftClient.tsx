"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Gift, Loader2, MessageSquareText, Package, ShoppingBag } from "lucide-react";
import { formatKES } from "@/lib/utils";

type WrapOption = {
  id: string;
  name: string;
  price: number;
  image: string | null;
  description: string | null;
};

type CartItem = {
  id: string;
  slug: string;
  name: string;
  giftWrapAvailable: boolean;
  image: string | null;
  quantity: number;
  giftWrap: { name: string; price: number } | null;
  giftMessage: { message: string; from?: string; to?: string } | null;
};

type CartData = { items: CartItem[] };

export function WrapAGiftClient({ wraps }: { wraps: WrapOption[] }) {
  const [cart, setCart] = useState<CartData | null>(null);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [fromNames, setFromNames] = useState<Record<string, string>>({});
  const [toNames, setToNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCart = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      const data = (await res.json()) as { cart?: CartData; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not load your cart.");
      const next = data.cart ?? { items: [] };
      setCart(next);
      setSelected((current) => {
        const updated = { ...current };
        for (const item of next.items) {
          if (updated[item.id] === undefined) {
            updated[item.id] = wraps.find((w) => w.name === item.giftWrap?.name)?.id ?? "";
          }
        }
        return updated;
      });
      setMessages((current) => {
        const updated = { ...current };
        for (const item of next.items) if (updated[item.id] === undefined) updated[item.id] = item.giftMessage?.message ?? "";
        return updated;
      });
      setFromNames((current) => {
        const updated = { ...current };
        for (const item of next.items) if (updated[item.id] === undefined) updated[item.id] = item.giftMessage?.from ?? "";
        return updated;
      });
      setToNames((current) => {
        const updated = { ...current };
        for (const item of next.items) if (updated[item.id] === undefined) updated[item.id] = item.giftMessage?.to ?? "";
        return updated;
      });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your cart.");
    } finally {
      setLoading(false);
    }
  }, [wraps]);

  useEffect(() => { void loadCart(); }, [loadCart]);

  async function save(item: CartItem) {
    setSaving(item.id);
    setSaved(null);
    setError(null);
    try {
      const wrapId = selected[item.id] ?? "";
      const wrap = wraps.find((w) => w.id === wrapId);
      const wrapRes = await fetch(`/api/cart/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "giftWrap",
          giftWrap: wrap ? { id: wrap.id, name: wrap.name, price: wrap.price } : null,
        }),
      });
      const wrapData = (await wrapRes.json()) as { error?: string };
      if (!wrapRes.ok) throw new Error(wrapData.error ?? "Could not save the wrapping option.");

      const message = (messages[item.id] ?? "").trim();
      const from = (fromNames[item.id] ?? "").trim();
      const to = (toNames[item.id] ?? "").trim();
      const messageRes = await fetch(`/api/cart/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "giftMessage",
          giftMessage: message ? { message, ...(from ? { from } : {}), ...(to ? { to } : {}) } : null,
        }),
      });
      const messageData = (await messageRes.json()) as { error?: string };
      if (!messageRes.ok) throw new Error(messageData.error ?? "Could not save your gift message.");

      setSaved(item.id);
      await loadCart();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your gift preferences.");
    } finally {
      setSaving(null);
    }
  }

  const itemCount = cart?.items.length ?? 0;

  function applyWrapToCart(wrapId: string) {
    const eligible = (cart?.items ?? []).filter((item) => item.giftWrapAvailable);
    if (!eligible.length) {
      document.getElementById("your-gifts")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setSelected((current) => {
      const next = { ...current };
      for (const item of eligible) next[item.id] = wrapId;
      return next;
    });
    document.getElementById("your-gifts")?.scrollIntoView({ behavior: "smooth" });
  }

  function ownGiftWhatsApp(wrapName: string, price: number) {
    const message = [
      "Hi Zed Gift Shop, I have my own gift (not bought from your website) and would like wrapping only.",
      `Wrapping style: ${wrapName}`,
      `Displayed wrapping price: ${formatKES(price)}`,
      "Please confirm availability, delivery or drop-off arrangements, and payment options.",
    ].join("\\n");
    return `https://wa.me/254711436169?text=${encodeURIComponent(message)}`;
  }

  return (
    <div className="container-zed py-8 sm:py-12">
      <header className="py-5 sm:py-7">
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#321b30] sm:text-4xl">Wrap a Gift</h1>
        <p className="mt-2 text-sm text-[#766b75]">Choose a wrapping style to make your gift special.</p>
      </header>

      <section className="mt-2">
        <div className="mb-4">
          <h2 className="font-display text-xl font-bold text-[#321b30] sm:text-2xl">Personalize your gift</h2>
        </div>
        {wraps.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {wraps.map((wrap) => (
              <article key={wrap.id} className="overflow-hidden rounded-xl border border-[#eadfe8] bg-white">
                <div className="relative aspect-square bg-[#faf7fa]">
                  {wrap.image ? (
                    <Image src={wrap.image} alt={wrap.name} fill sizes="(min-width:1024px) 25vw, 50vw" unoptimized className="object-cover" />
                  ) : (
                    <div className="grid size-full place-items-center text-[#a37b9a]"><Gift className="size-12" strokeWidth={1.2} /></div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-bold text-[#321b30]">{wrap.name}</h3>
                  <p className="mt-1 text-sm font-bold text-[#542447]">{wrap.price > 0 ? formatKES(wrap.price) : "Free"}</p>
                  <button type="button" onClick={() => applyWrapToCart(wrap.id)} className="mt-3 w-full rounded-lg bg-[#542447] px-3 py-2.5 text-xs font-bold text-white hover:bg-[#3f1b36]">Use for website order</button>
                  <a href={ownGiftWhatsApp(wrap.name, wrap.price)} target="_blank" rel="noreferrer noopener" className="mt-2 block rounded-lg border border-[#d9c8d6] px-3 py-2.5 text-center text-xs font-bold text-[#542447] hover:bg-[#f8f1f7]">Wrap my own gift</a>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <>
            <p className="mb-3 text-xs text-[#8a7d88]">Sample designs and prices — replace these with your real packages in Admin → Gift Wrap.</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {[
                { id: "demo-classic", name: "Classic Gift Wrap", price: 150, image: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=900&q=85" },
                { id: "demo-premium", name: "Premium Gift Wrap", price: 250, image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=900&q=85" },
                { id: "demo-luxury", name: "Luxury Gift Box", price: 350, image: "https://images.unsplash.com/photo-1513883049090-d0b7439799bf?auto=format&fit=crop&w=900&q=85" },
              ].map((wrap) => (
                <article key={wrap.id} className="overflow-hidden rounded-xl border border-[#eadfe8] bg-white">
                  <div className="relative aspect-square bg-[#faf7fa]">
                    <Image src={wrap.image} alt={wrap.name} fill sizes="(min-width:1024px) 25vw, 50vw" unoptimized className="object-cover" />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-bold text-[#321b30]">{wrap.name}</h3>
                    <p className="mt-1 text-sm font-bold text-[#542447]">{formatKES(wrap.price)}</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[#9a8496]">Demo option</p>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <div className="mt-6 grid gap-3 rounded-xl bg-[#f8f3f7] p-4 sm:grid-cols-2">
        <div>
          <h3 className="text-sm font-bold text-[#321b30]">Buying a gift from Zed?</h3>
          <p className="mt-1 text-xs text-[#5d4658]">Choose “Use for website order” on a wrapping card, save it against your cart item, then continue to the normal checkout and M-Pesa payment.</p>
          <a href="/shop" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#542447] underline underline-offset-4">Shop gifts <ArrowRight className="size-3" /></a>
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#321b30]">Already have your own gift?</h3>
          <p className="mt-1 text-xs text-[#5d4658]">Choose “Wrap my own gift” on a wrapping card. WhatsApp opens with the style and displayed price so we can arrange wrapping only.</p>
          <a href={ownGiftWhatsApp("Style to be confirmed", 0)} target="_blank" rel="noreferrer noopener" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#542447] underline underline-offset-4">Arrange wrapping on WhatsApp <ArrowRight className="size-3" /></a>
        </div>
      </div>

      <section id="your-gifts" className="mt-10 scroll-mt-24">
        <div className="mb-4 flex items-center gap-2">
          <ShoppingBag className="size-5 text-[#542447]" />
          <div>
            <h2 className="font-display text-xl font-bold text-[#321b30]">Your gifts</h2>
            <p className="text-sm text-[#766b75]">Select wrapping and write a personal card for each item in your cart.</p>
          </div>
        </div>

        {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-[#eadfe8] bg-white p-10 text-sm text-[#766b75]"><Loader2 className="size-4 animate-spin" /> Loading your cart…</div>
        ) : itemCount === 0 ? (
          <div className="rounded-xl border border-[#eadfe8] bg-white px-5 py-10 text-center">
            <Package className="mx-auto size-10 text-[#b995b0]" />
            <h3 className="mt-3 font-display text-lg font-bold text-[#321b30]">Your cart is waiting for a gift</h3>
            <p className="mt-1 text-sm text-[#766b75]">Add a product first, then come back to choose its wrapping.</p>
            <Link href="/shop" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#542447] px-5 py-3 text-sm font-semibold text-white hover:bg-[#3f1b36]">Explore gifts <ArrowRight className="size-4" /></Link>
          </div>
        ) : (
          <div className="space-y-4">
            {cart?.items.map((item) => {
              const chosen = wraps.find((w) => w.id === selected[item.id]);
              return (
                <article key={item.id} className="rounded-xl border border-[#eadfe8] bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex gap-3">
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-[#faf7fa]">
                      {item.image ? <Image src={item.image} alt={item.name} fill sizes="80px" unoptimized className="object-contain p-1" /> : <div className="grid size-full place-items-center text-[#a37b9a]"><Gift className="size-7" /></div>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/product/${item.slug}`} className="line-clamp-2 text-sm font-bold text-[#321b30] hover:text-[#542447]">{item.name}</Link>
                      <p className="mt-1 text-xs text-[#766b75]">Quantity: {item.quantity}</p>
                      {item.giftWrap && <p className="mt-1 text-xs font-semibold text-[#542447]">Currently wrapped: {item.giftWrap.name}</p>}
                    </div>
                  </div>

                  {item.giftWrapAvailable ? (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#6e5369]">Select packaging</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      <button type="button" onClick={() => setSelected((s) => ({ ...s, [item.id]: "" }))} className={`rounded-lg border px-3 py-3 text-left text-xs font-semibold transition ${!selected[item.id] ? "border-[#542447] bg-[#f8f1f7] text-[#542447] ring-1 ring-[#542447]" : "border-[#eadfe8] bg-white text-[#655763] hover:border-[#b995b0]"}`}>
                        No wrapping
                      </button>
                      {wraps.map((wrap) => (
                        <button key={wrap.id} type="button" onClick={() => setSelected((s) => ({ ...s, [item.id]: wrap.id }))} className={`rounded-lg border px-3 py-3 text-left transition ${selected[item.id] === wrap.id ? "border-[#542447] bg-[#f8f1f7] ring-1 ring-[#542447]" : "border-[#eadfe8] bg-white hover:border-[#b995b0]"}`}>
                          <span className="block text-xs font-semibold text-[#321b30]">{wrap.name}</span>
                          <span className="mt-1 block text-xs font-bold text-[#542447]">{wrap.price > 0 ? formatKES(wrap.price) : "Free"}</span>
                          {selected[item.id] === wrap.id && <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-[#542447]"><Check className="size-3" /> Selected</span>}
                        </button>
                      ))}
                    </div>
                    {chosen && <p className="mt-2 text-xs text-[#766b75]">Selected: {chosen.name} · {chosen.price > 0 ? formatKES(chosen.price) : "Free"}</p>}
                  </div>
                  ) : (
                    <p className="mt-4 rounded-lg bg-[#f8f5ef] px-3 py-2 text-xs leading-5 text-[#756b62]">Online wrapping is not enabled for this product. You can still contact us to check whether we can wrap it as a special request.</p>
                  )}

                  <div className="mt-4 rounded-lg bg-[#fcf9fc] p-3">
                    <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#6e5369]"><MessageSquareText className="size-4" /> Gift card message</label>
                    <textarea value={messages[item.id] ?? ""} onChange={(e) => setMessages((s) => ({ ...s, [item.id]: e.target.value }))} maxLength={500} rows={3} placeholder="Write a thoughtful message…" className="w-full resize-y rounded-lg border border-[#eadfe8] bg-white px-3 py-2 text-sm text-[#321b30] outline-none placeholder:text-[#a69aa5] focus:border-[#8d6684] focus:ring-2 focus:ring-[#eadce8]" />
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <input value={fromNames[item.id] ?? ""} onChange={(e) => setFromNames((s) => ({ ...s, [item.id]: e.target.value }))} maxLength={80} placeholder="From (optional)" className="min-w-0 rounded-lg border border-[#eadfe8] bg-white px-3 py-2 text-xs text-[#321b30] outline-none focus:border-[#8d6684]" />
                      <input value={toNames[item.id] ?? ""} onChange={(e) => setToNames((s) => ({ ...s, [item.id]: e.target.value }))} maxLength={80} placeholder="To (optional)" className="min-w-0 rounded-lg border border-[#eadfe8] bg-white px-3 py-2 text-xs text-[#321b30] outline-none focus:border-[#8d6684]" />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-[11px] text-[#8a7d88]">Save your choices for this gift.</p>
                    <button type="button" onClick={() => void save(item)} disabled={saving === item.id} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#542447] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#3f1b36] disabled:opacity-60">
                      {saving === item.id ? <Loader2 className="size-4 animate-spin" /> : saved === item.id ? <Check className="size-4" /> : <Gift className="size-4" />}
                      {saving === item.id ? "Saving…" : saved === item.id ? "Saved" : "Save gift options"}
                    </button>
                  </div>
                </article>
              );
            })}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#eadfe8] bg-[#fcf9fc] p-4">
              <p className="text-xs text-[#766b75]">Your wrapping and card message will be included with the matching cart item.</p>
              <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("zed:open-cart"))} className="inline-flex items-center gap-2 rounded-lg border border-[#d9c8d6] bg-white px-4 py-2.5 text-xs font-bold text-[#542447] hover:bg-[#f8f1f7]">Review cart <ArrowRight className="size-4" /></button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
