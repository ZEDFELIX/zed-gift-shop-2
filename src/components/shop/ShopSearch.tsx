"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function ShopSearch({ initialValue = "" }: { initialValue?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialValue);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const q = value.trim();
    if (q) params.set("q", q);
    else params.delete("q");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function clear() {
    setValue("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <form onSubmit={submit} className="relative w-full max-w-xl" role="search">
      <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[rgba(48,37,34,0.62)]" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search gifts, categories, occasions..."
        aria-label="Search gifts"
        className="h-12 w-full rounded-full glass-panel border border-white/60 bg-white/60 pl-11 pr-12 text-sm text-[var(--color-ink)] shadow-glass outline-none transition-all placeholder:text-[rgba(48,37,34,0.62)] focus:border-soft-sage focus:bg-white/85 focus:ring-4 focus:ring-zed-700/10"
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-[rgba(48,37,34,0.62)] transition-colors hover:bg-white hover:text-[var(--color-ink)]"
        >
          <X className="size-4" />
        </button>
      )}
    </form>
  );
}
