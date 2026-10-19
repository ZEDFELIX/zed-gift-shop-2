"use client";

import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { ProductWithRelations } from "@/lib/data/products";
import { discountPercent, formatKES } from "@/lib/utils";
import { WishlistButton } from "@/components/product/WishlistButton";
import { AddToCartButton } from "@/components/product/AddToCartButton";

export function ProductCard({
  product,
  inWishlist = false,
}: {
  product: ProductWithRelations;
  inWishlist?: boolean;
}) {
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

  return (
    <article className="zed-product-card group overflow-hidden rounded-lg">
      <div className="relative group-hover:opacity-100 transition-opacity">
        <Link
          href={`/product/${product.slug}`}
          className="zed-product-media block aspect-square overflow-hidden bg-white"
          aria-label={product.name}
        >
          <div className="relative w-full h-full overflow-hidden bg-white transition-transform duration-500">
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
                sizes="(min-width:1360px) 340px, (min-width:1024px) 25vw, 48vw"
                className="scale-[1.25] object-cover transition-transform duration-700 ease-out group-hover:scale-[1.32]"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-rose-50 text-rose-400 font-display text-lg">
                ZED
              </div>
            )}
          </div>
        </Link>
      </div>

      <div className="flex flex-col flex-1 p-2.5 text-center sm:p-3 lg:p-3.5">
        <h3 className="min-h-[2.4rem] text-[13px] font-semibold leading-snug sm:text-[15px] lg:min-h-[2.8rem] lg:text-base">
          <Link href={`/product/${product.slug}`} className="hover:text-rose-600">
            {product.name}
          </Link>
        </h3>

        <div className="mt-1.5 flex flex-wrap items-baseline justify-center gap-x-1.5">
          <p className="text-[15px] font-bold text-charcoal-950 sm:text-base lg:text-lg">{formatKES(product.price)}</p>
          {product.compareAtPrice != null && product.compareAtPrice > product.price ? (
            <p className="min-w-0 text-xs text-charcoal/40 line-through">
              {formatKES(product.compareAtPrice)}
            </p>
          ) : null}
        </div>

        <div className="mt-auto pt-2">
          {canQuickAdd ? (
            <AddToCartButton productId={product.id} label="Add to cart" variant="outline" />
          ) : (
            <Link
              href={`/product/${product.slug}`}
              className="mt-1 flex min-h-11 items-center justify-center gap-1 border border-edge px-2 py-1.5 text-center text-[11px] font-semibold text-charcoal transition-colors hover:border-rose-300 hover:text-rose-600"
            >
              {personalizable ? (
                <>
                  <Star className="size-2.5" /> Personalize
                </>
              ) : (
                "View details"
              )}
            </Link>
          )}
          {lowStock && (
            <p className="mt-1 text-[11px] font-medium text-rose-500">
              Only {product.quantity - product.reservedQuantity} left
            </p>
          )}
        </div>
      </div>
    </article>
  );
}