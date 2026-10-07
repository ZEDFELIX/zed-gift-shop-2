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
  <ul className="space-y-1 text-sm text-charcoal/60">
   {items.map((c) => {
    const active = params.get(keyName) === c.slug;
    return (
     <li key={c.slug}>
      <button
       type="button"
       onClick={() => go(keyName, active ? "" : c.slug)}
       className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 ${active ? "bg-rose-50 text-rose-700" : "hover:bg-rose-50"} text-charcoal`}
      >
       <span>{c.name}</span>
       <span className="text-xs text-charcoal/40">{c.count}</span>
      </button>
     </li>
    );
   })}
  </ul>
 );

 const Filters = (
  <div className="space-y-6">
   <div>
    <p className="ebrow mb-3 text-charcoal/60">Sort</p>
    <div className="relative">
     <select
      value={sort}
      onChange={(e) => go("sort", e.target.value)}
      className="field w-full appearance-none border border-charcoal/20 rounded-xl bg-white/20 px-3 py-2 text-sm"
      aria-label="Sort products"
     >
      {Object.entries(sortLabels).map(([key, label]) => (
       <option key={key} value={key}>
        {label}
       </option>
      ))}
     </select>
     <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3 -translate-y-1/2 text-charcoal/40" />
    </div>
   </div>

   <div>
    <p className="ebrow mb-3 text-charcoal/60">Price (KES)</p>
    <form onSubmit={applyPrice} className="flex items-center gap-2">
     <input
      value={min}
      onChange={(e) => setMin(e.target.value)}
      inputMode="numeric"
placeholder={String(minPrice).length > 0 ? String(minPrice) : "Min"}
       className="field flex-1 border border-charcoal/20 rounded-xl bg-white/20 px-3 py-2 text-sm"
      aria-label="Minimum price"
     />
     <span className="text-charcoal/40">-</span>
     <input
      value={max}
      onChange={(e) => setMax(e.target.value)}
      inputMode="numeric"
      placeholder={String(maxPrice).length > 0 ? String(maxPrice) : "Max"}
      className="field flex-1 border border-charcoal/20 rounded-xl bg-white/20 px-3 py-2 text-sm"
      aria-label="Maximum price"
     />
     <button type="submit" className="rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-bold text-white uppercase tracking-wider Go">
      Go
     </button>
    </form>
   </div>

   <div>
    <p className="ebrow mb-3 text-charcoal/60">Quick picks</p>
    <label className="flex cursor-pointer items-center gap-2 text-sm text-charcoal">
     <input
      type="checkbox"
      checked={Boolean(params.get("personalized"))}
      onChange={(e) => go("personalized", e.target.checked ? "1" : "")}
      className="size-4 accent-rose-500 rounded"
     />
     Personalized only
    </label>
    <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-charcoal">
     <input
      type="checkbox"
      checked={Boolean(params.get("inStock"))}
      onChange={(e) => go("inStock", e.target.checked ? "1" : "")}
      className="size-4 accent-rose-500 rounded"
     />
     In stock only
    </label>
   </div>

   {occasions.length > 0 && (
    <div>
     <p className="ebrow mb-3 text-charcoal/60">Occasion</p>
     <FacetList items={occasions} keyName="occasion" />
    </div>
   )}
   {recipients.length > 0 && (
    <div>
     <p className="ebrow mb-3 text-charcoal/60">Recipient</p>
     <FacetList items={recipients} keyName="recipient" />
    </div>
   )}
   {categories.length > 0 && (
    <div>
     <p className="ebrow mb-3 text-charcoal/60">Category</p>
     <FacetList items={categories} keyName="category" />
    </div>
   )}

   {activeFilterCount > 0 && (
    <div className="mt-3 flex items-center gap-2">
     <RotateCcw className="size-3" /> Clear all filters ({activeFilterCount})
     <button
      type="button"
      onClick={clearAll}
      className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600 underline underline-offset-2 hover:underline"
     >
      Clear
     </button>
    </div>
   )}
  </div>
 );

 return (
  <div className="space-y-3">
   {/* Mobile filter toggle */}
   <div className="flex items-center justify-between gap-2 lg:hidden">
    <button
     type="button"
     onClick={() => setFiltersOpen(true)}
     className="glass-panel inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-charcoal"
    >
     <SlidersHorizontal className="size-3" /> Filters
     {activeFilterCount > 0 && (
      <span className="grid size-5 place-items-center rounded-full bg-rose-100 text-[10px] font-bold text-rose-600">{activeFilterCount}</span>
     )}
    </button>
    <select
     value={sort}
     onChange={(e) => go("sort", e.target.value)}
     className="field appearance-none pr-3 border border-charcoal/20 rounded-xl bg-white/20 px-3 py-2 text-sm"
     aria-label="Sort products"
    >
     {Object.entries(sortLabels).map(([key, label]) => (
      <option key={key} value={key}>{label}</option>
     ))}
    </select>
   </div>

   {/* Desktop sidebar */}
   <aside className="glass-panel hidden w-64 shrink-0 self-start rounded-xl p-4 lg:block">
    <div className="text-sm text-charcoal/60">{Filters}</div>
   </aside>

   {/* Mobile filter drawer */}
   {filtersOpen && (
    <div className="fixed inset-0 z-[60] lg:hidden">
     <div className="absolute inset-0 bg-charcoal/40" onClick={() => setFiltersOpen(false)} aria-hidden="true" />
     <div className="absolute inset-y-0 right-0 flex w-[min(90vw,380px)] flex-col bg-white/95 shadow-sm backdrop-blur-xl animate-[drawer_0.3s_cubic-bezier(0.16,1,0.3,1)_both]">
      <div className="flex items-center justify-between border-b border-charcoal/10 bg-white/80 px-4 py-3">
       <p className="font-display text-lg font-bold text-charcoal">Filters</p>
       <button
        type="button"
        onClick={() => setFiltersOpen(false)}
        aria-label="Close filters"
        className="grid size-9 place-items-center rounded-xl hover:bg-charcoal/5">
        <X className="size-4.5" />
       </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">{Filters}</div>
     </div>
    </div>
   )}
  </div>
 );
}