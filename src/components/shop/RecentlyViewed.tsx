"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Clock3 } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import type { ProductCardData } from "@/lib/data/products";

const STORAGE_KEY = "zed-recently-viewed-v1";

export function RecentlyViewed() {
  const [products, setProducts] = useState<ProductCardData[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(saved)) {
        setProducts(saved.filter((item) => item && typeof item.id === "string" && typeof item.slug === "string").slice(0, 8));
      }
    } catch {
      setProducts([]);
    }
  }, []);

  if (!products.length) return null;

  return (
    <section className="mb-3 hidden overflow-hidden rounded-lg border border-[#eee5ec] bg-white p-2 lg:block" aria-label="Recently viewed gifts">
      <div className="mb-1.5 flex items-center justify-between gap-2 border-b border-[#eee5ec] pb-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-6 shrink-0 place-items-center rounded-md bg-[#f5eaf2] text-[#794568]">
            <Clock3 className="size-3" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-xs font-bold text-[#342832]">Pick up where you left off</h2>
            
          </div>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1 text-[9px] font-semibold text-[#8a5578]">Recently viewed <ArrowRight className="size-3" /></span>
      </div>
      <div className="flex snap-x snap-mandatory gap-1.5 overflow-x-auto overscroll-x-contain scrollbar-none">
        {products.map((product, index) => (
          <div key={product.id} className="w-[96px] min-w-[96px] shrink-0 snap-start sm:w-[108px] sm:min-w-[108px]">
            <ProductCard product={product} priority={index < 2} />
          </div>
        ))}
      </div>
    </section>
  );
}
