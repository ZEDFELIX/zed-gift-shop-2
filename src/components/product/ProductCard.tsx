"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Star } from "lucide-react";
import type { ProductWithRelations } from "@/lib/data/products";
import { discountPercent, formatKES } from "@/lib/utils";

export function ProductCard({ product }: { product: ProductWithRelations }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const image = product.images[0]?.url;
  const sale = discountPercent(product.price, product.compareAtPrice);
  const inStock = !product.trackInventory || product.quantity > product.reservedQuantity;
  const personalizable = product.personalizationEnabled;
  const canQuickAdd = inStock && !personalizable;
  const isNew = product.tags.some((t) => ["new", "new arrival"].includes(t.toLowerCase()));
  const lowStock =
    product.trackInventory &&
    inStock &&
    product.quantity - product.reservedQuantity <= 5;

  let badge: { label: string; cls: string } | null = null;
  if (!inStock) {
    badge = { label: "Out of stock", cls: "bg-charcoal text-white" };
  } else if (sale != null && sale > 0) {
    badge = { label: `Sale -${sale}%`, cls: "bg-rose-500 text-white" };
  } else if (personalizable) {
    badge = { label: "Personalizable", cls: "bg-rose-100 text-rose-700" };
  } else if (isNew) {
    badge = { label: "New", cls: "bg-plum-800 text-white" };
  }

  async function quickAdd() {
    if (adding) return;
    setAdding(true);
    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      if (res.ok) {
        window.dispatchEvent(new CustomEvent("zed:open-cart"));
        router.refresh();
      }
    } catch {
      // Swallow network errors; cart drawer stays closed.
    } finally {
      setAdding(false);
    }
  }

  const media = (
    <div className="relative w-full h-full overflow-hidden bg-white transition-transform duration-500">
      {badge && (
        <span className={`absolute left-2 top-2 z-10 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide shadow ${badge.cls}`}>
          {badge.label}
        </span>
      )}
      {adding && (
        <span className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 text-[12px] font-bold uppercase tracking-wide text-rose-600">
          Adding...
        </span>
      )}
      {image ? (
        <Image
          src={image}
          alt={product.images[0]?.alt ?? product.name}
          fill
          sizes="(min-width:1360px) 340px, (min-width:1024px) 25vw, 48vw"
          className="scale-[1.25] object-cover transition-transform duration-700 ease-out group-hover:scale-[1.32]"
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
      <div className="relative group-hover:opacity-100 transition-opacity">
        {canQuickAdd ? (
          <button
            type="button"
            onClick={quickAdd}
            disabled={adding}
            className="zed-product-media block w-full cursor-pointer overflow-hidden bg-white text-left"
            aria-label={`Add ${product.name} to cart`}
          >
            {media}
          </button>
        ) : (
          <Link
            href={`/product/${product.slug}`}
            className="zed-product-media block overflow-hidden bg-white"
            aria-label={product.name}
          >
            {media}
          </Link>
        )}
      </div>

      <div className="flex flex-1 flex-col p-2 text-center sm:p-2.5">
        <h3 className="line-clamp-2 h-[2.2rem] text-[12px] font-semibold leading-snug sm:h-[2.4rem] sm:text-[13px] lg:h-[2.75rem] lg:text-base">
          <Link href={`/product/${product.slug}`} className="hover:text-rose-600">
            {product.name}
          </Link>
        </h3>

        <div className="mt-1 flex min-h-[1.2rem] flex-wrap items-baseline justify-center gap-x-1">
          <p className="text-[13px] font-bold text-charcoal-950 sm:text-[15px] lg:text-lg">{formatKES(product.price)}</p>
          {product.compareAtPrice != null && product.compareAtPrice > product.price ? (
            <p className="min-w-0 text-xs text-charcoal/40 line-through">
              {formatKES(product.compareAtPrice)}
            </p>
          ) : null}
        </div>

        <div className="mt-auto pt-1.5 flex flex-col items-center gap-0.5">
          <Link
            href={`/product/${product.slug}`}
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-charcoal/70 transition-colors hover:text-rose-600 sm:text-[11px]"
          >
            {personalizable ? (
              <>
                <Star className="size-2.5" /> Personalize
              </>
            ) : (
              "View details"
            )}
          </Link>
          {lowStock && (
            <p className="text-[10px] font-medium leading-4 text-rose-500 sm:text-[11px]">
              Only {product.quantity - product.reservedQuantity} left
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
