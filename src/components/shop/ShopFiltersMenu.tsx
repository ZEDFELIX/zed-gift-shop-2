"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronDown, RotateCcw, SlidersHorizontal } from "lucide-react";

type Facet = { slug: string; name: string; count: number };

export function ShopFiltersMenu({
  categories,
  occasions,
  recipients,
  minPrice,
  maxPrice,
  sortLabels,
}: {
  categories: Facet[];
  occasions: Facet[];
  recipients: Facet[];
  minPrice: number;
  maxPrice: number;
  sortLabels: Record<string, string>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());

  const [open, setOpen] = useState(false);
  const [min, setMin] = useState(params.get("min") ?? "");
  const [max, setMax] = useState(params.get("max") ?? "");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const sort = params.get("sort") || "featured";
  const activeFilterCount = [
    "category",
    "occasion",
    "recipient",
    "collection",
    "personalized",
    "inStock",
    "min",
    "max",
    "deals",
    "flashSale",
    "bestSeller",
  ].filter((k) => params.get(k)).length;

  function go(key: string, value: string) {
    const p = new URLSearchParams(params.toString());
    if (!value) p.delete(key);
    else p.set(key, value);
    p.delete("page");
    router.push(`${pathname}?${p.toString()}`);
  }

  function applyPrice(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams(params.toString());
    const lo = min.trim();
    const hi = max.trim();
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

  const FacetList = ({ items, keyName }: { items: Facet[]; keyName: string }) => (
    <ul className="space-y-1 text-sm">
      {items.map((c) => {
        const active = params.get(keyName) === c.slug;
        return (
          <li key={c.slug}>
            <button
              type="button"
              onClick={() => go(keyName, active ? "" : c.slug)}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left ${active ? "bg-rose-50 text-rose-700" : "text-charcoal hover:bg-rose-50"}`}
            >
              <span>{c.name}</span>
              <span className="text-xs text-charcoal/40">{c.count}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="glass-panel inline-flex items-center gap-2 rounded-zed px-3.5 py-2 text-sm font-semibold text-[var(--color-ink)]"
      >
        <SlidersHorizontal className="size-4" />
        Filters
        {activeFilterCount > 0 && (
          <span className="grid size-5 place-items-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
            {activeFilterCount}
          </span>
        )}
        <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 max-h-[70vh] w-[min(90vw,360px)] overflow-y-auto rounded-zed border border-edge bg-white p-4 shadow-glass-lg">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-charcoal/50">Sort</p>
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => go("sort", e.target.value)}
                className="field w-full appearance-none rounded-xl border border-charcoal/20 bg-white/20 px-3 py-2 text-sm"
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

          <div className="mt-5">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-charcoal/50">Price (KES)</p>
            <form onSubmit={applyPrice} className="flex items-center gap-2">
              <input
                value={min}
                onChange={(e) => setMin(e.target.value)}
                inputMode="numeric"
                placeholder={String(minPrice)}
                className="field flex-1 rounded-xl border border-charcoal/20 bg-white/20 px-3 py-2 text-sm"
                aria-label="Minimum price"
              />
              <span className="text-charcoal/40">-</span>
              <input
                value={max}
                onChange={(e) => setMax(e.target.value)}
                inputMode="numeric"
                placeholder={String(maxPrice)}
                className="field flex-1 rounded-xl border border-charcoal/20 bg-white/20 px-3 py-2 text-sm"
                aria-label="Maximum price"
              />
              <button type="submit" className="rounded-xl bg-zed-950 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white">
                Go
              </button>
            </form>
          </div>

          <div className="mt-5 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-charcoal/50">Quick picks</p>
            {[
              { key: "personalized", label: "Personalized only" },
              { key: "inStock", label: "In stock only" },
              { key: "deals", label: "On sale only" },
              { key: "bestSeller", label: "Best sellers only" },
            ].map((q) => (
              <label key={q.key} className="flex cursor-pointer items-center gap-2 text-sm text-charcoal">
                <input
                  type="checkbox"
                  checked={Boolean(params.get(q.key))}
                  onChange={(e) => go(q.key, e.target.checked ? "1" : "")}
                  className="size-4 rounded accent-rose-500"
                />
                {q.label}
              </label>
            ))}
          </div>

          {categories.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-charcoal/50">Category</p>
              <FacetList items={categories} keyName="category" />
            </div>
          )}
          {occasions.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-charcoal/50">Occasion</p>
              <FacetList items={occasions} keyName="occasion" />
            </div>
          )}
          {recipients.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-charcoal/50">Recipient</p>
              <FacetList items={recipients} keyName="recipient" />
            </div>
          )}

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-charcoal/15 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
            >
              <RotateCcw className="size-3.5" /> Clear all filters ({activeFilterCount})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
