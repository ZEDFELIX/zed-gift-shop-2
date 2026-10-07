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
                sizes="(min-width:1280px) 23vw, (min-width:768px) 31vw, 50vw"
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
          <div className="mt-1 flex gap-1">
            <button
              onClick={(e) => {
                const text = `Hello ZED Gift Shop, I would like to order:\n${product.name}\nQuantity: 1\nPrice: KSh ${product.price}\n${product.personalizationEnabled && product.personalizationFieldsJson ? `Personalization: See options` : ''}\n${window.location.origin}/product/${product.slug}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
              }}
              className="flex flex-1 items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-semibold text-rose-600 rounded-md bg-rose-50 hover:bg-rose-100 transition-colors"
              aria-label="Order via WhatsApp"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.88 2H5.12C3.22 2 1.34 3.88 1.46 5.86L2.93 14H11.07L12.5 20.03L13.97 14H22.05C24.16 11.47 25.96 8.5 25.73 6.18L24.07 2.14C23.95 1.39 22.17 1 20.88 2ZM7.53 8.53l3.85 3.86L2 7.09l5.08-.06L7.53 8.53ZM4.63 10.08l2.06 2.02L3.5 17.6l5.35-.9c.47.46.97.73 1.48.73.86 0 1.56-.3 1.98-.68l1.06-1.04.96-2.35c.16-.37.28-.75.28-1.33v-.5c0-.94-.53-1.73-1.28-2.08L9 6.34l-1.06.95L5.38 2.36c-.36-.66-.95-1.06-1.65-1.06-1.06 0-1.68.7-1.68 1.75v.65z"/>
              </svg>
              WhatsApp
            </button>
            <button
              onClick={(e) => {
                const text = `Hi! I'd like to chat about ${product.name}`;
                window.open(`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '254711436169'}?text=${encodeURIComponent(text)}`, '_blank');
              }}
              className="flex-1 items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-semibold text-charcoal rounded-md bg-white/80 hover:bg-charcoal/10 transition-colors"
              aria-label="Chat about this product"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.88 2H5.12C3.22 2 1.34 3.88 1.46 5.86L2.93 14H11.07L12.5 20.03L13.97 14H22.05C24.16 11.47 25.96 8.5 25.73 6.18L24.07 2.14C23.95 1.39 22.17 1 20.88 2Z"/>
              </svg>
              Chat
            </button>
          </div>
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