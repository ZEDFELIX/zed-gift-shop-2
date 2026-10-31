"use client";

import Image from "next/image";
import Link from "next/link";
import type { ProductCardData } from "@/lib/data/products";
import { discountPercent, formatKES } from "@/lib/utils";

export function ProductCard({ product, priority = false, textColor, flashSaleTag = false }: { product: ProductCardData; priority?: boolean; textColor?: string; flashSaleTag?: boolean }) {
  const image = product.images[0]?.url;
  const sale = discountPercent(product.price, product.compareAtPrice);
  const inStock = !product.trackInventory || product.quantity > product.reservedQuantity;
  const isNew = product.tags.some((t) => ["new", "new arrival"].includes(t.toLowerCase()));
  const showFlashSaleTag = flashSaleTag || product.tags.some((tag) => tag.trim().toLowerCase() === "flash-sale");
  const lowStock =
    product.trackInventory &&
    inStock &&
    product.quantity - product.reservedQuantity <= 5;

  let badge: { label: string; cls: string } | null = null;
  if (!inStock) {
    badge = { label: "Out of stock", cls: "bg-charcoal text-white" };
  } else if (isNew) {
    badge = { label: "New", cls: "bg-plum-800 text-white" };
  }

  const media = (
    <div className="relative aspect-[6/5] w-full min-w-0 overflow-hidden bg-white transition-transform duration-300 sm:aspect-[5/4] lg:aspect-[1/1]">
      {showFlashSaleTag && (
        <span className="absolute right-0 top-3 z-20 rounded-l-md bg-[#E11D48] px-1.5 py-2 text-[9px] font-extrabold uppercase leading-none tracking-[0.12em] text-white shadow-md [writing-mode:vertical-rl]" aria-label="Flash sale">
          Flash Sale
        </span>
      )}
      {badge && (
        <span className={`absolute left-2 top-2 z-10 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide shadow ${badge.cls}`}>
          {badge.label}
        </span>
      )}
      {image ? (
        <Image
          src={image}
          alt={product.images[0]?.alt ?? product.name}
          fill
          sizes="(min-width:1360px) 340px, (min-width:1024px) 25vw, 45vw"
          quality={60}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "low"}
          className="object-contain object-center transition-transform duration-200 ease-out group-hover:scale-[1.02]"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-rose-50 text-rose-400 font-display text-lg">
          ZED
        </div>
      )}
    </div>
  );

  return (
    <article className="zed-product-card group flex h-full flex-col overflow-hidden rounded-lg">
      <div className="relative transition-opacity group-hover:opacity-100">
        <Link
          href={`/product/${product.slug}`}
          className="zed-product-media block w-full min-w-0 overflow-hidden bg-white"
          aria-label={`View ${product.name} details`}
          onClick={() => {
            try {
              const key = "zed-recently-viewed-v1";
              const previous = JSON.parse(window.localStorage.getItem(key) || "[]") as ProductCardData[];
              const next = [product, ...previous.filter((item) => item.id !== product.id)].slice(0, 8);
              window.localStorage.setItem(key, JSON.stringify(next));
            } catch { /* Keep product navigation working when storage is unavailable. */ }
          }}
        >
          {media}
        </Link>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-2.5 text-center sm:p-3 lg:p-4" style={textColor ? { color: textColor } : undefined}>
        <h3 className="line-clamp-2 min-h-[2.4rem] text-[12px] font-semibold leading-snug [overflow-wrap:anywhere] sm:min-h-[2.7rem] sm:text-sm lg:min-h-[3rem] lg:text-base">
          <Link href={`/product/${product.slug}`} style={textColor ? { color: textColor } : undefined} className={textColor ? "transition-opacity hover:opacity-80" : "hover:text-rose-600"}>
            {product.name}
          </Link>
        </h3>

        <div className="mt-1 flex min-h-[1.2rem] flex-wrap items-baseline justify-center gap-x-1">
          <p className="break-words text-[13px] font-bold text-charcoal-950 sm:text-[15px] lg:text-lg" style={textColor ? { color: textColor } : undefined}>{formatKES(product.price)}</p>
          {product.compareAtPrice != null && product.compareAtPrice > product.price ? (
            <p className="min-w-0 text-xs line-through" style={textColor ? { color: textColor, opacity: 0.72 } : undefined}>
              {formatKES(product.compareAtPrice)}
            </p>
          ) : null}
          {sale != null && sale > 0 && product.compareAtPrice != null && product.compareAtPrice > product.price ? (
            <span
              className="inline-flex max-w-full shrink-0 items-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold leading-none text-white shadow-sm sm:px-2 sm:text-[10px]"
              aria-label={`Save ${sale} percent`}
            >
              -{sale}% OFF
            </span>
          ) : null}
        </div>

        {lowStock && (
          <p className="mt-auto pt-2 text-[10px] font-semibold leading-4 text-rose-500 sm:text-[11px]" style={textColor ? { color: "#FFD166" } : undefined}>
            Only {product.quantity - product.reservedQuantity} left
          </p>
        )}
      </div>
    </article>
  );
}
