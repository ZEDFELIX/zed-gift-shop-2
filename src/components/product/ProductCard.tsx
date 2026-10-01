import "server-only";

import Image from "next/image";
import Link from "next/link";
import { Sparkles, Star } from "lucide-react";
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
    badge = { label: "Personalizable", cls: "bg-violet-100 text-violet-700" };
  } else if (isNew) {
    badge = { label: "New", cls: "bg-plum-800 text-white" };
  }

  return (
    <article className="group flex h-full flex-col border border-edge bg-white">
      <div className="relative bg-plum-50">
        <Link
          href={`/product/${product.slug}`}
          className="block aspect-square"
          aria-label={product.name}
        >
          {image ? (
            <Image
              src={image}
              alt={product.images[0]?.alt ?? product.name}
              fill
              sizes="(min-width:1280px) 22vw, (min-width:1024px) 30vw, (min-width:640px) 33vw, 50vw"
              className="object-cover transition-opacity duration-200 group-hover:opacity-95"
            />
          ) : (
            <span className="grid aspect-square place-items-center bg-plum-100 font-display text-2xl text-plum-600">
              ZED
            </span>
          )}
        </Link>

        {badge ? (
          <span
            className={`absolute left-3 top-3 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${badge.cls}`}
          >
            {badge.label}
          </span>
        ) : null}

        <div className="absolute right-2 top-2">
          <WishlistButton productId={product.id} initialInWishlist={inWishlist} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-[11px] uppercase tracking-wide text-muted">
            {product.categories[0]?.category.name ?? "Gift"}
          </p>
          {product.ratingCount > 0 ? (
            <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              {product.ratingAverage.toFixed(1)}
              <span className="hidden sm:inline">({product.ratingCount})</span>
            </span>
          ) : null}
        </div>

        <h3 className="mt-1.5 min-h-[2.6rem] text-[15px] font-semibold leading-snug">
          <Link href={`/product/${product.slug}`} className="hover:text-rose-600">
            {product.name}
          </Link>
        </h3>

        {product.shortDescription ? (
          <p className="mt-1 hidden line-clamp-2 text-[13px] leading-relaxed text-muted sm:block">
            {product.shortDescription}
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-baseline gap-2">
          <p className="text-[16px] font-bold text-plum-950">{formatKES(product.price)}</p>
          {product.compareAtPrice != null && product.compareAtPrice > product.price ? (
            <p className="text-xs text-muted line-through">
              {formatKES(product.compareAtPrice)}
            </p>
          ) : null}
        </div>

        <div className="mt-auto pt-3">
          {canQuickAdd ? (
            <AddToCartButton productId={product.id} label="Add to cart" variant="outline" />
          ) : (
            <Link
              href={`/product/${product.slug}`}
              className="flex items-center justify-center gap-1.5 border border-edge px-3 py-2.5 text-center text-xs font-semibold text-ink transition-colors hover:border-rose-400 hover:text-rose-600"
            >
              {personalizable ? (
                <>
                  <Sparkles className="size-3.5" /> Personalize
                </>
              ) : (
                "View details"
              )}
            </Link>
          )}
          {lowStock ? (
            <p className="mt-2 text-[11px] font-medium text-rose-600">
              Only {product.quantity - product.reservedQuantity} left
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}