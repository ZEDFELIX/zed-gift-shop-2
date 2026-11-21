"use client";
import { useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
export function ShopMobileTools() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = new URLSearchParams(params.toString());
    const value = query.trim();
    if (value) next.set("q", value); else next.delete("q");
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  }
  return <div className="mb-3 flex items-center gap-2 lg:hidden">
    <form onSubmit={submit} role="search" className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-2xl border border-[var(--zed-brand-secondary)]/15 bg-white/90 px-3 shadow-sm backdrop-blur-xl">
      <Search className="size-4 shrink-0 text-[var(--zed-brand-secondary)]" />
      <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="What are you looking for?" aria-label="Search gifts" className="min-w-0 flex-1 bg-transparent text-sm text-[var(--zed-text-body)] outline-none placeholder:text-slate-400" />
      <button type="submit" aria-label="Search" className="grid size-8 shrink-0 place-items-center rounded-xl bg-[var(--zed-brand-primary)] text-white"><Search className="size-4" /></button>
    </form>
    <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("zed:toggle-shop-filters"))} aria-label="Open filters" className="grid size-11 shrink-0 place-items-center rounded-2xl border border-[var(--zed-brand-secondary)]/15 bg-white text-[var(--zed-brand-secondary)] shadow-sm"><SlidersHorizontal className="size-5" /></button>
  </div>;
}
