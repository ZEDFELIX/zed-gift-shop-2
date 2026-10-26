"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeftRight, Check, Trash2 } from "lucide-react";
import { formatKES } from "@/lib/utils";
import type { CompareGift } from "@/components/product/CompareGiftButton";

const KEY = "zed-gift-compare-v1";
const EVENT = "zed:compare-updated";

export default function ComparePage() {
  const [items, setItems] = useState<CompareGift[]>([]);
  const [ready, setReady] = useState(false);

  function read() {
    try {
      const value = JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as CompareGift[];
      setItems(Array.isArray(value) ? value.slice(0, 4) : []);
    } catch { setItems([]); }
    setReady(true);
  }

  useEffect(() => {
    read();
    window.addEventListener(EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, []);

  function remove(id: string) {
    const next = items.filter((item) => item.id !== id);
    window.localStorage.setItem(KEY, JSON.stringify(next));
    setItems(next);
    window.dispatchEvent(new CustomEvent(EVENT));
  }

  function clear() {
    window.localStorage.removeItem(KEY);
    setItems([]);
    window.dispatchEvent(new CustomEvent(EVENT));
  }

  if (!ready) return <main className="container-zed py-12 text-sm text-charcoal/60">Loading comparison…</main>;

  return (
    <main className="container-zed py-8 sm:py-12">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Choose with confidence</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-[#171717] sm:text-4xl">Compare gifts</h1>
          <p className="mt-2 text-sm text-charcoal/60">Compare prices, availability and personalization side by side.</p>
        </div>
        {items.length > 0 && <button type="button" onClick={clear} className="inline-flex items-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm font-semibold hover:bg-white"><Trash2 className="size-4" /> Clear all</button>}
      </header>

      {items.length === 0 ? (
        <section className="glass-card mt-8 rounded-xl p-8 text-center sm:p-12">
          <ArrowLeftRight className="mx-auto size-8 text-[#542447]" />
          <h2 className="mt-3 font-display text-xl font-bold">No gifts selected yet</h2>
          <p className="mt-2 text-sm text-charcoal/60">Browse the shop and tap Compare on up to four products.</p>
          <Link href="/shop" className="mt-5 inline-flex rounded-lg bg-[#171717] px-5 py-3 text-sm font-bold text-white">Browse gifts</Link>
        </section>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-black/10 bg-white/70">
          <table className="w-full min-w-[620px] border-collapse text-left text-sm">
            <thead><tr><th className="w-36 border-b border-black/10 p-3 text-xs uppercase tracking-wide text-charcoal/50">Compare</th>{items.map((item) => <th key={item.id} className="min-w-48 border-b border-l border-black/10 p-3 align-top"><div className="relative aspect-square overflow-hidden rounded-lg bg-white">{item.image ? <Image src={item.image} alt={item.name} fill sizes="180px" className="object-contain" /> : null}</div><Link href={`/product/${item.slug}`} className="mt-3 block font-semibold text-[#171717] hover:text-[#542447]">{item.name}</Link><button type="button" onClick={() => remove(item.id)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:underline"><Trash2 className="size-3.5" /> Remove</button></th>)}</tr></thead>
            <tbody>
              <tr><th className="border-b border-black/10 p-3 text-xs text-charcoal/60">Price</th>{items.map((item) => <td key={item.id} className="border-b border-l border-black/10 p-3 font-bold">{formatKES(item.price)}{item.compareAtPrice && item.compareAtPrice > item.price ? <p className="mt-1 text-xs font-normal text-charcoal/40 line-through">{formatKES(item.compareAtPrice)}</p> : null}</td>)}</tr>
              <tr><th className="border-b border-black/10 p-3 text-xs text-charcoal/60">Availability</th>{items.map((item) => <td key={item.id} className="border-b border-l border-black/10 p-3"><span className={item.inStock ? "text-emerald-700" : "text-rose-700"}>{item.inStock ? "In stock" : "Out of stock"}</span></td>)}</tr>
              <tr><th className="border-b border-black/10 p-3 text-xs text-charcoal/60">Personalization</th>{items.map((item) => <td key={item.id} className="border-b border-l border-black/10 p-3">{item.personalizable ? <span className="inline-flex items-center gap-1 text-emerald-700"><Check className="size-4" /> Available</span> : "Not listed"}</td>)}</tr>
              <tr><th className="p-3 text-xs text-charcoal/60">Product page</th>{items.map((item) => <td key={item.id} className="border-l border-black/10 p-3"><Link href={`/product/${item.slug}`} className="font-semibold text-[#542447] hover:underline">View gift</Link></td>)}</tr>
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
