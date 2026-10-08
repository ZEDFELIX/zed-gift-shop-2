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

  const imageStyle = image
    ? { backgroundImage: `url("${image}")` }
    : { backgroundColor: "var(--color-rose-light)" };

  return (
    <article className="zed-product-card group overflow-hidden rounded-lg">
      <div className="relative group-hover:opacity-100 transition-opacity">
        <Link
          href={`/product/${product.slug}`}
          className="zed-product-media block aspect-square overflow-hidden"
          aria-label={product.name}
        >
          <div
            className="relative w-full h-full overflow-hidden transition-transform duration-500"
            style={imageStyle}
          >
            {image ? (
              <Image
                src={image}
                alt={product.images[0]?.alt ?? product.name}
                fill
                sizes="(min-width:1280px) 23vw, (min-width:768px) 31vw, 46vw"
                className="object-cover transition-opacity duration-200 group-hover:opacity-95"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-rose-50 text-rose-400 font-display text-lg">
                ZED
              </div>
            )}
          </div>
        </Link>

        {badge ? (
          <span
            className={`absolute left-3 top-3 px-2 py-1 text-[0.75rem] font-semibold uppercase tracking-wider ${badge.cls}` }
          >
            {badge.label}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col flex-1 p-2.5 sm:p-3">
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="hidden">{product.categories[0]?.category.name ?? "Gift"}</p>
          {false ? (
            <span className="text-[0.65rem] text-charcoal/60">
              <Star className="size-2 fill-rose-400" />
              {product.ratingAverage.toFixed(1)}
              <span className="text-charcoal/40 hidden sm:inline">({product.ratingCount})</span>
            </span>
          ) : null}
        </div>

        <h3 className="mt-1 min-h-[2.2rem] text-[12px] font-semibold leading-snug sm:text-[13px]">
          <Link href={`/product/${product.slug}`} className="hover:text-rose-600">
            {product.name}
          </Link>
        </h3>

        {false && product.shortDescription ? (
          <p className="mt-1 text-[0.65rem] leading-relaxed text-charcoal/60 line-clamp-2">
            {product.shortDescription}
          </p>
        ) : null}

        <div className="mt-1.5 flex items-baseline gap-1.5">
          <p className="text-[14px] font-bold text-charcoal-950">{formatKES(product.price)}</p>
          {product.compareAtPrice != null && product.compareAtPrice > product.price ? (
            <p className="text-xs text-charcoal/40 line-through">
              {formatKES(product.compareAtPrice)}
            </p>
          ) : null}
        </div>

        <div className="mt-auto pt-1.5">
          {canQuickAdd ? (
            <AddToCartButton productId={product.id} label="Add to cart" variant="outline" />
          ) : (
            <Link
              href={`/product/${product.slug}`}
              className="mt-1 flex items-center justify-center gap-1 border border-edge px-2 py-1.5 text-center text-[11px] font-semibold text-charcoal transition-colors hover:border-rose-300 hover:text-rose-600"
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
          {false && lowStock && (
            <p className="mt-1 text-[0.55rem] font-medium text-rose-500">
              Only {product.quantity - product.reservedQuantity} left
            </p>
          )}
        </div>
      </div>
    </article>
  );
}