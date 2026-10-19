"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, LayoutGrid } from "lucide-react";

/** Mobile-only dropdown at the top of the listing holding the category widgets. */
export function CatalogMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Browse categories"
        className="glass-panel inline-flex items-center gap-2 rounded-zed px-3.5 py-2 text-sm font-semibold text-[var(--color-ink)]"
      >
        <LayoutGrid className="size-4" />
        Categories
        <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 max-h-[70vh] w-[min(88vw,340px)] space-y-3 overflow-y-auto rounded-zed border border-white/70 bg-white/85 p-3 shadow-glass-lg backdrop-blur-xl"
        >
          {children}
        </div>
      )}
    </div>
  );
}
