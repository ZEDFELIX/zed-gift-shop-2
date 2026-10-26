"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeftRight, Check, Plus, Search, Trash2 } from "lucide-react";
import { formatKES } from "@/lib/utils";
import type { CompareGift } from "@/components/product/CompareGiftButton";

const KEY = "zed-gift-compare-v1";
const EVENT = "zed:compare-updated";

type SearchGift = CompareGift & { category?: string | null };

export default function ComparePage() {
  const [items, setItems] = useState<CompareGift[]>([]);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchGift[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  function read() {
    try {
      const value = JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as CompareGift[];
      setItems(Array.isArray(value) ? value.filter((item) => item && typeof item.id === "string").slice(0, 4) : []);
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

  function save(next: CompareGift[]) {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    setItems(next);
    window.dispatchEvent(new CustomEvent(EVENT));
  }

  async function searchProducts(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    if (!q) {
      setResults([]);
      setError("Enter a product name to search.");
      return;
    }
    setSearching(true);
    setError("");
    try {
      const response = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Search is temporarily unavailable. Please try again.");
      const data = await response.json() as { results?: SearchGift[] };
      setResults((data.results ?? []).filter((gift) => !items.some((item) => item.id === gift.id)));
      if (!(data.results ?? []).length) setError("No matching gifts found. Try a shorter search.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to search right now.");
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function add(gift: CompareGift) {
    if (items.some((item) => item.id === gift.id)) return;
    if (items.length >= 4) {
      setError("You can compare up to 4 gifts. Remove one before adding another.");
      return;
    }
    save([...items, gift]);
    setResults((current) => current.filter((item) => item.id !== gift.id));
    setError("");
  }

  function remove(id: string) {
    save(items.filter((item) => item.id !== id));
  }

  function clear() {
    window.localStorage.removeItem(KEY);
    setItems([]);
    setResults([]);
    window.dispatchEvent(new CustomEvent(EVENT));
  }

  if (!ready) return <main className="container-zed py-12 text-sm text-charcoal/60">Loading comparison…</main>;

  return (
    <main className="container-zed py-8 sm:py-12">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Choose with confidence</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-[#171717] sm:text-4xl">Compare gifts</h1>
          <p className="mt-2 max-w-2xl text-sm text-charcoal/60">Search for the gifts you are considering and add only the ones you want to compare. Choose up to four products.</p>
        </div>
        {items.length > 0 && <button type="button" onClick={clear} className="inline-flex items-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm font-semibold hover:bg-white"><Trash2 className="size-4" /> Clear comparison</button>}
      </header>

      <section className="glass-card mt-6 rounded-xl p-4 sm:p-5">
        <form onSubmit={searchProducts} className="flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="compare-search">Search gifts to compare</label>
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-black/10 bg-white/80 px-3">
            <Search className="size-4 shrink-0 text-[#542447]" />
            <input id="compare-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search gifts by name…" className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none" />
          </div>
          <button type="submit" disabled={searching} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#171717] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"><Search className="size-4" /> {searching ? "Searching…" : "Find gifts"}</button>
        </form>
        {error && <p role="status" className="mt-3 text-sm text-rose-700">{error}</p>}
        {results.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((gift) => {
              const alreadyAdded = items.some((item) => item.id === gift.id);
              return (
                <article key={gift.id} className="flex min-w-0 gap-3 rounded-lg border border-black/10 bg-white/70 p-3">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-white">
                    {gift.image ? <Image src={gift.image} alt={gift.name} fill sizes="80px" className="object-contain" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/product/${gift.slug}`} className="line-clamp-2 text-sm font-semibold text-[#171717] hover:text-[#542447]">{gift.name}</Link>
                    <p className="mt-1 text-sm font-bold">{formatKES(gift.price)}</p>
                    {gift.category && <p className="mt-0.5 text-xs text-charcoal/50">{gift.category}</p>}
                    <button type="button" onClick={() => add(gift)} disabled={alreadyAdded || items.length >= 4} className="mt-2 inline-flex items-center gap-1 rounded-md border border-[#542447]/20 px-2.5 py-1.5 text-xs font-bold text-[#542447] hover:bg-[#542447]/5 disabled:cursor-not-allowed disabled:opacity-50">
                      {alreadyAdded ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
                      {alreadyAdded ? "Added" : "Add to compare"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {items.length === 0 ? (
        <section className="glass-card mt-6 rounded-xl p-8 text-center sm:p-12">
          <ArrowLeftRight className="mx-auto size-8 text-[#542447]" />
          <h2 className="mt-3 font-display text-xl font-bold">Choose gifts to compare</h2>
          <p className="mt-2 text-sm text-charcoal/60">Search above, then add the products you want to compare. Your selection stays in this browser.</p>
          <Link href="/shop" className="mt-5 inline-flex rounded-lg bg-[#171717] px-5 py-3 text-sm font-bold text-white">Browse all gifts</Link>
        </section>
      ) : (
        <>
          <div className="mt-6 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-charcoal/70">{items.length} of 4 gifts selected</p>
            <Link href="/shop" className="text-sm font-semibold text-[#542447] hover:underline">Browse more gifts</Link>
          </div>
          <div className="mt-3 overflow-x-auto rounded-xl border border-black/10 bg-white/70">
            <table className="w-full min-w-[620px] border-collapse text-left text-sm">
              <thead><tr><th className="w-36 border-b border-black/10 p-3 text-xs uppercase tracking-wide text-charcoal/50">Compare</th>{items.map((item) => <th key={item.id} className="min-w-48 border-b border-l border-black/10 p-3 align-top"><div className="relative aspect-square overflow-hidden rounded-lg bg-white">{item.image ? <Image src={item.image} alt={item.name} fill sizes="180px" className="object-contain" /> : null}</div><Link href={`/product/${item.slug}`} className="mt-3 block font-semibold text-[#171717] hover:text-[#542447]">{item.name}</Link><button type="button" onClick={() => remove(item.id)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:underline"><Trash2 className="size-3.5" /> Remove</button></th>)}</tr></thead>
              <tbody>
                <tr><th className="border-b border-black/10 p-3 text-xs text-charcoal/60">Price</th>{items.map((item) => <td key={item.id} className="border-b border-l border-black/10 p-3 font-bold">{formatKES(item.price)}{item.compareAtPrice != null && item.compareAtPrice > item.price ? <p className="mt-1 text-xs font-normal text-charcoal/40 line-through">{formatKES(item.compareAtPrice)}</p> : null}</td>)}</tr>
                <tr><th className="border-b border-black/10 p-3 text-xs text-charcoal/60">Availability</th>{items.map((item) => <td key={item.id} className="border-b border-l border-black/10 p-3"><span className={item.inStock ? "text-emerald-700" : "text-rose-700"}>{item.inStock ? "In stock" : "Out of stock"}</span></td>)}</tr>
                <tr><th className="border-b border-black/10 p-3 text-xs text-charcoal/60">Personalization</th>{items.map((item) => <td key={item.id} className="border-b border-l border-black/10 p-3">{item.personalizable ? <span className="inline-flex items-center gap-1 text-emerald-700"><Check className="size-4" /> Available</span> : "Not listed"}</td>)}</tr>
                <tr><th className="p-3 text-xs text-charcoal/60">Product page</th>{items.map((item) => <td key={item.id} className="border-l border-black/10 p-3"><Link href={`/product/${item.slug}`} className="font-semibold text-[#542447] hover:underline">View gift</Link></td>)}</tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
