"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronDown, RotateCcw, SlidersHorizontal, X } from "lucide-react";

function updateUrl(searchParams: URLSearchParams, key: string, value: string | null) {
 if (value === null || value === "") searchParams.delete(key);
 else searchParams.set(key, value);
 searchParams.delete("page");
 return searchParams.toString();
}

export function ShopControls({
 categories,
 occasions,
 recipients,
 minPrice,
 maxPrice,
 sortLabels,
}: {
 categories: { slug: string; name: string; count: number }[];
 occasions: { slug: string; name: string; count: number }[];
 recipients: { slug: string; name: string; count: number }[];
 minPrice: number;
 maxPrice: number;
 sortLabels: Record<string, string>;
}) {
 const router = useRouter();
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const params = new URLSearchParams(searchParams.toString());

 const [min, setMin] = useState(params.get("min") ?? "");
 const [max, setMax] = useState(params.get("max") ?? "");
 const [filtersOpen, setFiltersOpen] = useState(false);

 useEffect(() => {
 document.body.style.overflow = filtersOpen ? "hidden" : "";
 return () => {
 document.body.style.overflow = "";
 };
 }, [filtersOpen]);

 const sort = (params.get("sort") || "featured") as string;
 const activeFilterCount = ["category", "occasion", "recipient", "collection", "personalized", "inStock", "min", "max"].filter(
 (k) => params.get(k),
 ).length;

 function go(key: string, value: string) {
 router.push(`${pathname}?${updateUrl(params, key, value)}`);
 }

 function applyPrice(e: React.FormEvent) {
 e.preventDefault();
 const p = new URLSearchParams(params.toString());
 const lo = min.trim();
 const hi = max.trim();
 if (lo && isNaN(Number(lo))) return;
 if (hi && isNaN(Number(hi))) return;
 if (lo) p.set("min", lo);
 else p.delete("min");
 if (hi) p.set("max", hi);
 else p.delete("max");
 p.delete("page");
 router.push(`${pathname}?${p.toString()}`);
 }

 function clearAll() {
 router.push(pathname);
 setMin("");
 setMax("");
 }

 const FacetList = ({ items, keyName }: { items: { slug: string; name: string; count: number }[]; keyName: string }) => (
 <ul className="space-y-1">
 {items.map((c) => {
 const active = params.get(keyName) === c.slug;
 return (
 <li key={c.slug}>
 <button
 type="button"
 onClick={() => go(keyName, active ? "" : c.slug)}
 className={`flex w-full items-center justify-between rounded-zed px-2 py-1.5 text-sm ${active ? "bg-warm-white font-semibold text-[var(--color-ink)]" : "text-[var(--color-ink)] hover:bg-zed-900/5"}`}
 >
 <span>{c.name}</span>
 <span className="text-xs text-[rgba(48,37,34,0.62)]">{c.count}</span>
 </button>
 </li>
 );
 })}
 </ul>
 );

 const Filters = (
 <div className="space-y-7">
 <div>
 <p className="eyebrow mb-3">Sort</p>
 <div className="relative">
 <select
 value={sort}
 onChange={(e) => go("sort", e.target.value)}
 className="field appearance-none pr-9"
 aria-label="Sort products"
 >
 {Object.entries(sortLabels).map(([key, label]) => (
 <option key={key} value={key}>
 {label}
 </option>
 ))}
 </select>
 <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[rgba(48,37,34,0.62)]" />
 </div>
 </div>

 <div>
 <p className="eyebrow mb-3">Price (KES)</p>
 <form onSubmit={applyPrice} className="flex items-center gap-2">
 <input value={min} onChange={(e) => setMin(e.target.value)} inputMode="numeric" placeholder={String(minPrice)} className="field text-sm" aria-label="Minimum price" />
 <span className="text-[rgba(48,37,34,0.62)]">-</span>
 <input value={max} onChange={(e) => setMax(e.target.value)} inputMode="numeric" placeholder={String(maxPrice)} className="field text-sm" aria-label="Maximum price" />
 <button type="submit" className="rounded-zed bg-zed-950 px-3 py-2.5 text-xs font-bold text-white">
 Go
 </button>
 </form>
 </div>

 <div>
 <p className="eyebrow mb-3">Quick picks</p>
 <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--color-ink)]">
 <input type="checkbox" checked={Boolean(params.get("personalized"))} onChange={(e) => go("personalized", e.target.checked ? "1" : "")} className="size-4 accent-deep-olive" />
 Personalized only
 </label>
 <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-[var(--color-ink)]">
 <input type="checkbox" checked={Boolean(params.get("inStock"))} onChange={(e) => go("inStock", e.target.checked ? "1" : "")} className="size-4 accent-deep-olive" />
 In stock only
 </label>
 </div>

 {occasions.length > 0 && (
 <div>
 <p className="eyebrow mb-3">Occasion</p>
 <FacetList items={occasions} keyName="occasion" />
 </div>
 )}
 {recipients.length > 0 && (
 <div>
 <p className="eyebrow mb-3">Recipient</p>
 <FacetList items={recipients} keyName="recipient" />
 </div>
 )}
 {categories.length > 0 && (
 <div>
 <p className="eyebrow mb-3">Category</p>
 <FacetList items={categories} keyName="category" />
 </div>
 )}

 {activeFilterCount > 0 && (
 <button type="button" onClick={clearAll} className="inline-flex items-center gap-1.5 text-sm font-semibold text-zed-700 underline-offset-2 hover:underline">
 <RotateCcw className="size-4" /> Clear all filters ({activeFilterCount})
 </button>
 )}
 </div>
 );

 return (
 <>
 {/* Mobile filter toggle */}
 <div className="flex items-center justify-between gap-3 lg:hidden">
 <button
 type="button"
 onClick={() => setFiltersOpen(true)}
 className="glass-panel inline-flex items-center gap-2 rounded-zed px-4 py-2.5 text-sm font-semibold text-[var(--color-ink)]"
 >
 <SlidersHorizontal className="size-4" />
 Filters
 {activeFilterCount > 0 && (
 <span className="grid size-5 place-items-center rounded-full bg-zed-950 text-[11px] font-bold text-white">{activeFilterCount}</span>
 )}
 </button>
 <div className="relative">
 <select value={sort} onChange={(e) => go("sort", e.target.value)} className="field appearance-none pr-9 text-sm" aria-label="Sort products">
 {Object.entries(sortLabels).map(([key, label]) => (
 <option key={key} value={key}>{label}</option>
 ))}
 </select>
 <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[rgba(48,37,34,0.62)]" />
 </div>
 </div>

 {/* Desktop sidebar */}
 <aside className="glass-panel hidden w-64 shrink-0 self-start rounded-zed p-4 pr-2 lg:block">{Filters}</aside>

 {/* Mobile filter drawer */}
 {filtersOpen && (
 <div className="fixed inset-0 z-[60] lg:hidden">
 <div className="absolute inset-0 bg-zed-950/45" onClick={() => setFiltersOpen(false)} />
 <div className="absolute inset-y-0 right-0 flex w-[min(90vw,360px)] flex-col bg-warm-white/85 shadow-drawer backdrop-blur-xl animate-[drawer_0.3s_cubic-bezier(0.16,1,0.3,1)_both]">
 <div className="flex items-center justify-between border-b border-white/50 bg-white/40 px-4 py-3.5">
 <p className="font-display text-lg font-bold text-[var(--color-ink)]">Filters</p>
 <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters" className="grid size-9 place-items-center rounded-zed hover:bg-zed-900/5">
 <X className="size-5" />
 </button>
 </div>
 <div className="flex-1 overflow-y-auto p-5">{Filters}</div>
 </div>
 </div>
 )}
 </>
 );
}