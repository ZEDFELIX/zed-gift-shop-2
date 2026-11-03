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

  return (
    <div className="container-zed py-8 sm:py-12">
      <header className="relative overflow-hidden rounded-2xl border border-[#eadfe8] bg-gradient-to-br from-[#fbf7fa] via-white to-[#f4edf3] px-5 py-8 sm:px-9 sm:py-11">
        <div className="relative z-10 max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7b5572]">The finishing touch</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#321b30] sm:text-4xl">Wrap a Gift</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#665663] sm:text-base">
            Bring your own gift for wrapping, or buy a gift from us and add wrapping before checkout or later from your cart.
          </p>
          <a href="#your-gifts" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#542447] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3f1b36]">
            Personalise your gifts <ArrowRight className="size-4" />
          </a>
        </div>
        <div className="pointer-events-none absolute -right-8 -top-10 hidden size-64 rounded-full border-[24px] border-[#eadce8] opacity-60 sm:block" />
        <div className="pointer-events-none absolute -bottom-16 right-24 hidden size-44 rounded-full bg-[#eadce8]/60 blur-2xl sm:block" />
        <Gift className="absolute bottom-7 right-10 hidden size-24 text-[#b995b0]/50 sm:block" strokeWidth={1} />
      </header>

      <section className="mt-7">
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b6a31]">A beautiful finish for every present</p>
          <h2 className="mt-1 font-display text-xl font-bold text-[#211b17] sm:text-2xl">What kind of gift are you wrapping?</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#756b62]">Use this guide to find the right wrapping size. The exact price is shown on each wrapping option below, before you choose.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <article className="rounded-2xl border border-[#e9dfd1] bg-[#fffaf2] p-4 sm:p-5"><div className="mb-3 grid size-10 place-items-center rounded-full bg-[#efe2ca] text-[#76552a]"><Gift className="size-5" /></div><h3 className="text-sm font-bold text-[#2b241d]">Small & delicate</h3><p className="mt-1 text-xs leading-5 text-[#756b62]">Jewellery, keyholders, small accessories and compact gifts.</p><p className="mt-3 border-t border-[#e9dfd1] pt-2 text-[11px] font-semibold text-[#76552a]">Neat wrap · tissue · ribbon</p></article>
          <article className="rounded-2xl border border-[#e9dfd1] bg-[#f8f5ef] p-4 sm:p-5"><div className="mb-3 grid size-10 place-items-center rounded-full bg-[#e9e0d2] text-[#76552a]"><Package className="size-5" /></div><h3 className="text-sm font-bold text-[#2b241d]">Medium presents</h3><p className="mt-1 text-xs leading-5 text-[#756b62]">Watches, perfumes, mugs, wallets, books and standard gift boxes.</p><p className="mt-3 border-t border-[#e9dfd1] pt-2 text-[11px] font-semibold text-[#76552a]">Gift box or paper · ribbon · tag</p></article>
          <article className="rounded-2xl border border-[#e9dfd1] bg-[#f6f1f5] p-4 sm:p-5"><div className="mb-3 grid size-10 place-items-center rounded-full bg-[#e8dce6] text-[#69455f]"><ShoppingBag className="size-5" /></div><h3 className="text-sm font-bold text-[#2b241d]">Large & multi-item</h3><p className="mt-1 text-xs leading-5 text-[#756b62]">Hampers, shoes, clothing sets and gifts with several items.</p><p className="mt-3 border-t border-[#e5d9e3] pt-2 text-[11px] font-semibold text-[#69455f]">Large packaging · secure finish</p></article>
          <article className="rounded-2xl border border-[#e9dfd1] bg-[#f5f3ed] p-4 sm:p-5"><div className="mb-3 grid size-10 place-items-center rounded-full bg-[#e8e1cf] text-[#76552a]"><Gift className="size-5" /></div><h3 className="text-sm font-bold text-[#2b241d]">Premium & custom</h3><p className="mt-1 text-xs leading-5 text-[#756b62]">Luxury finishes, keepsake boxes, themed wrapping and special requests.</p><p className="mt-3 border-t border-[#e9dfd1] pt-2 text-[11px] font-semibold text-[#76552a]">Personalised finishing · quote first</p></article>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-[#e9dfd1] bg-white p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-3">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a793f]">01 · Bring it</p><h3 className="mt-1 text-sm font-bold text-[#2b241d]">Bring your own gift</h3><p className="mt-1 text-xs leading-5 text-[#756b62]">You can bring an item bought anywhere. You do not need to purchase the gift from us.</p></div>
          <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a793f]">02 · Choose it</p><h3 className="mt-1 text-sm font-bold text-[#2b241d]">Select the finish</h3><p className="mt-1 text-xs leading-5 text-[#756b62]">Choose an available wrap style below. Each option displays its price and packaging details.</p></div>
          <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a793f]">03 · Approve it</p><h3 className="mt-1 text-sm font-bold text-[#2b241d]">Confirm before we wrap</h3><p className="mt-1 text-xs leading-5 text-[#756b62]">Share the gift size or a photo on WhatsApp. We confirm the final price and arrangement first.</p></div>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-[#321b30]">Choose your wrapping style</h2>
            <p className="mt-1 text-sm text-[#766b75]">Choose from the available finishes below. Prices are shown in KSh; ask us first if your gift needs an oversized or custom wrap.</p>
          </div>
          <Link href="/shop" className="hidden text-sm font-semibold text-[#542447] underline-offset-4 hover:underline sm:inline">Browse gifts</Link>
        </div>
        {wraps.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {wraps.map((wrap) => (
              <article key={wrap.id} className="overflow-hidden rounded-xl border border-[#eadfe8] bg-white shadow-sm">
                <div className="relative aspect-[5/4] bg-[#faf7fa]">
                  {wrap.image ? (
                    <Image src={wrap.image} alt={wrap.name} fill sizes="(min-width:1024px) 25vw, 50vw" unoptimized className="object-contain p-3" />
                  ) : (
                    <div className="grid size-full place-items-center text-[#a37b9a]"><Gift className="size-12" strokeWidth={1.2} /></div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-bold text-[#321b30]">{wrap.name}</h3>
                  {wrap.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#766b75]">{wrap.description}</p>}
                  <p className="mt-2 text-sm font-bold text-[#542447]">{wrap.price > 0 ? formatKES(wrap.price) : "Free"}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#d9c8d6] bg-[#fcf9fc] p-6 text-center text-sm text-[#766b75]">
            We are updating our online wrap catalogue. Send us a photo or the approximate dimensions of your gift on WhatsApp and we will share the available wrapping styles and confirm the price before you visit.
          </div>
        )}
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-[#eadfe8] bg-[#542447] px-5 py-6 text-white sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-8">
        <div className="max-w-xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#eadce8]">Already have a present?</p>
          <h2 className="mt-2 font-display text-2xl font-bold">Bring a gift. We’ll wrap it.</h2>
          <p className="mt-2 text-sm leading-6 text-white/80">
            You don’t need to buy the gift from us. Bring your own item and we’ll help give it a beautiful finish. This service is for gift wrapping only.
          </p>
          <p className="mt-2 text-xs text-white/65">Visit us at 3rd Floor Avenue House, Nairobi, or message us to arrange your wrapping.</p>
        </div>
        <a
          href="https://wa.me/254711436169?text=Hi%20Zed%20Gift%20Shop%2C%20I%20have%20my%20own%20gift%20and%20would%20like%20to%20use%20your%20gift-wrapping%20service.%20Please%20share%20the%20wrapping%20options%20and%20prices."
          target="_blank"
          rel="noreferrer noopener"
          className="mt-5 inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#542447] transition hover:bg-[#f8f1f7] sm:mt-0"
        >
          Arrange gift wrapping <ArrowRight className="size-4" />
        </a>
      </section>

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
