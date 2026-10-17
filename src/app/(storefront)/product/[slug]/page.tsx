import "server-only";

import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Quote, ShieldCheck, Star, Truck } from "lucide-react";
import { getProductBySlug, getRelatedProducts, productSeoTitle } from "@/lib/data/products";
import { getSetting } from "@/lib/data/settings";
import { listApprovedReviews, ratingBreakdown } from "@/lib/data/reviews";
import { buildMetadata, jsonLdBreadcrumb, jsonLdProduct } from "@/lib/seo";
import { discountPercent, formatKES } from "@/lib/utils";
import { SITE } from "@/lib/constants";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductPurchase } from "@/components/product/ProductPurchase";
import { ReviewForm } from "@/components/product/ReviewForm";
import { TrackPageView } from "@/components/analytics/Trackers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
 const { slug } = await params;
 const product = await getProductBySlug(slug);
 if (!product) return {};
 return buildMetadata({
 title: productSeoTitle(product),
 description: product.shortDescription ?? product.description ?? undefined,
 path: `/product/${slug}`,
 image: product.images[0]?.url ?? undefined,
 type: "article",
 });
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
 const { slug } = await params;
 const product = await getProductBySlug(slug);
 if (!product) notFound();

  const [reviews, wrapOptions, related, categories, whatsappNumber] = await Promise.all([
  listApprovedReviews(product.id),
  prisma.giftWrap.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  getRelatedProducts(product.id, product.categories.map((c) => c.categoryId)),
  Promise.resolve(product.categories.map((c) => c.category)),
  getSetting("whatsappNumber"),
  ]);

 const breakdown = ratingBreakdown(reviews);
 const sale = discountPercent(product.price, product.compareAtPrice);
 const inStock = !product.trackInventory || product.quantity > product.reservedQuantity;
 const totalStock = product.quantity - product.reservedQuantity;
  const personalizationFields = product.personalizationFieldsJson
  ? (JSON.parse(product.personalizationFieldsJson) as { key: string; label: string; type: string; required?: boolean; maxLength?: number }[])
  : [];

  const primaryImage = product.images[0]?.url?.trim();
  const whatsappImage = primaryImage
  ? primaryImage.startsWith("http")
  ? primaryImage
  : `${SITE.url.replace(/\/$/, "")}${primaryImage.startsWith("/") ? "" : "/"}${primaryImage}`
  : undefined;
  const whatsappProductUrl = `${SITE.url.replace(/\/$/, "")}/product/${product.slug}`;

 const breadcrumb = jsonLdBreadcrumb([
 { name: "Shop", path: "/shop" },
 ...(categories[0] ? [{ name: categories[0].name, path: `/gifts/${categories[0].slug}` }] : []),
 { name: product.name, path: `/product/${product.slug}` },
 ]);

 const productJsonLd = jsonLdProduct({
 name: product.name,
 description: product.description,
 image: product.images[0]?.url,
 price: product.price,
 sku: product.sku,
 availability: inStock ? "in" : "out",
 });

  return (
  <div className="container-zed py-8 lg:py-12">
  <TrackPageView
    event="view_item"
    params={{ currency: "KES", value: product.price, items: [{ item_id: product.id, item_name: product.name }] }}
  />
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
 <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

 {/* Breadcrumbs */}
 <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 overflow-x-auto text-xs text-[rgba(48,37,34,0.62)]">
 <Link href="/" className="hover:text-zed-700">Home</Link>
 <ChevronRight className="size-3.5 shrink-0" />
 <Link href="/shop" className="hover:text-zed-700">Shop</Link>
 {categories[0] && (
 <>
 <ChevronRight className="size-3.5 shrink-0" />
 <Link href={`/gifts/${categories[0].slug}`} className="whitespace-nowrap hover:text-zed-700">
 {categories[0].name}
 </Link>
 </>
 )}
 <ChevronRight className="size-3.5 shrink-0" />
 <span className="whitespace-nowrap text-[var(--color-ink)]">{product.name}</span>
 </nav>

 <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
  {/* Gallery */}
  <div className="space-y-3">
  <ProductGallery images={product.images.map((img) => ({ url: img.url, alt: img.alt }))} name={product.name} sale={sale} />
 {product.videoUrl && (
  <div className="mt-3 overflow-hidden rounded-zed bg-black/5 ring-1 ring-white/50">
   <video src={product.videoUrl} controls playsInline preload="metadata" className="aspect-video w-full object-cover" aria-label={`${product.name} product video`} />
  </div>
 )}
 </div>

 {/* Info */}
 <div>
 <div className="flex flex-wrap items-center gap-2">
 {categories.slice(0, 3).map((c) => (
 <Link key={c.id} href={`/gifts/${c.slug}`} className="rounded-full bg-warm-white px-3 py-1 text-[11px] font-semibold text-zed-700 hover:bg-zed-950">
 {c.name}
 </Link>
 ))}
 {product.tags.slice(0, 2).map((t) => (
 <span key={t} className="rounded-full bg-white/45 px-3 py-1 text-[11px] font-semibold text-[rgba(48,37,34,0.62)]">
 {t}
 </span>
 ))}
 </div>

 <h1 className="mt-3 font-display text-[26px] font-black leading-tight text-[var(--color-ink)] sm:text-3xl lg:text-4xl">{product.name}</h1>
 {product.headline && <p className="mt-2 text-lg text-soft-sage">{product.headline}</p>}

 <div className="mt-3 flex items-center gap-2">
 {breakdown.count > 0 ? (
 <>
 <span className="flex items-center gap-1">
 {[1, 2, 3, 4, 5].map((s) => (
 <Star key={s} className={`size-4 ${s <= Math.round(breakdown.average) ? "fill-zed-950 text-zed-950" : "text-[rgba(48,37,34,0.62)]"}`} />
 ))}
 </span>
 <a href="#reviews" className="text-sm text-[rgba(48,37,34,0.62)] underline-offset-2 hover:underline">
 {breakdown.average.toFixed(1)} | {breakdown.count} review{breakdown.count === 1 ? "" : "s"}
 </a>
 </>
 ) : (
 <p className="text-sm text-[rgba(48,37,34,0.62)]">Be the first to review this gift</p>
 )}
 </div>

 <div className="mt-5 flex flex-wrap items-baseline gap-3">
 <p className="font-display text-3xl font-black text-[var(--color-ink)] sm:text-4xl">{formatKES(product.price)}</p>
 {product.compareAtPrice != null && product.compareAtPrice > product.price && (
 <>
 <p className="text-xl text-[rgba(48,37,34,0.62)] line-through">{formatKES(product.compareAtPrice)}</p>
 <span className="rounded-full bg-zed-950 px-2.5 py-1 text-xs font-bold text-white">
 Save {formatKES(product.compareAtPrice - product.price)}
 </span>
 </>
 )}
 </div>
 <p className="mt-1 text-sm">
 {inStock ? (
 <span className="font-semibold text-soft-sage">In stock{totalStock <= product.lowStockThreshold ? ` - only ${totalStock} left` : ""}</span>
 ) : (
 <span className="font-semibold text-red-600">Out of stock</span>
 )}
 </p>

 {product.shortDescription && <p className="mt-5 leading-relaxed text-[var(--color-ink)]">{product.shortDescription}</p>}

 <div className="mt-7">
 <ProductPurchase
 productId={product.id}
 slug={product.slug}
 basePrice={product.price}
 compareAtPrice={product.compareAtPrice}
 variants={product.variants.map((v) => ({
 id: v.id,
 name: v.name,
 value: v.value,
 priceOffset: v.priceOffset,
 inStock: !product.trackInventory || v.quantity - v.reservedQuantity > 0,
 }))}
 personalizationFields={personalizationFields}
 giftWrapOptions={wrapOptions.map((w) => ({ id: w.id, name: w.name, price: w.price, active: w.active }))}
 giftWrapAvailable={product.giftWrapAvailable}
  giftMessageAvailable={product.giftMessageAvailable}
  inStock={inStock}
  productName={product.name}
  whatsappNumber={typeof whatsappNumber === "string" && whatsappNumber.trim() ? whatsappNumber.trim() : "254711436169"}
  productImage={whatsappImage}
  productUrl={whatsappProductUrl}
  />
 </div>

 {/* USPs */}
 <div className="glass-card mt-8 grid gap-3 rounded-zed p-5 sm:grid-cols-2">
  <div className="flex items-center gap-2.5 text-sm text-[var(--color-ink)]">
  <Truck className="size-5 shrink-0 text-soft-sage" />
  Same-day Nairobi · 1–3 days countrywide
  </div>
  <div className="flex items-center gap-2.5 text-sm text-[var(--color-ink)]">
  <ShieldCheck className="size-5 shrink-0 text-soft-sage" />
  Secure M-PESA payment
  </div>
  <div className="flex items-center gap-2.5 text-sm text-[var(--color-ink)]">
  <Quote className="size-5 shrink-0 text-soft-sage" />
  Free gift note included
  </div>
  <div className="flex items-center gap-2.5 text-sm text-[var(--color-ink)]">
  <span className="grid size-5 shrink-0 place-items-center rounded bg-zed-950 text-[10px] font-black text-white">KES</span>
  Prices in KES
  </div>
 </div>
 </div>
 </div>

 {/* Description */}
 {product.description && (
 <section className="mx-auto mt-14 max-w-3xl">
 <h2 className="font-display text-2xl font-bold text-[var(--color-ink)]">About this gift</h2>
 <p className="mt-4 whitespace-pre-line leading-relaxed text-[var(--color-ink)]">{product.description}</p>
 </section>
 )}

 {/* Reviews */}
 <section id="reviews" className="mx-auto mt-14 max-w-4xl">
 <h2 className="font-display text-2xl font-bold text-[var(--color-ink)]">Customer reviews</h2>
 {breakdown.count > 0 && (
 <div className="mt-4 grid gap-6 sm:grid-cols-[180px_1fr]">
 <div>
 <p className="font-display text-5xl font-black text-[var(--color-ink)]">{breakdown.average.toFixed(1)}</p>
 <div className="mt-1 flex gap-0.5">
 {[1, 2, 3, 4, 5].map((s) => (
 <Star key={s} className={`size-4 ${s <= Math.round(breakdown.average) ? "fill-zed-950 text-zed-950" : "text-[rgba(48,37,34,0.62)]"}`} />
 ))}
 </div>
 <p className="mt-1 text-sm text-[rgba(48,37,34,0.62)]">{breakdown.count} review{breakdown.count === 1 ? "" : "s"}</p>
 </div>
 <div className="space-y-1.5">
 {breakdown.buckets.map((b) => (
 <div key={b.star} className="flex items-center gap-3 text-xs">
 <span className="w-8 text-[rgba(48,37,34,0.62)]">{b.star}</span>
 <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/50">
 <div className="h-full rounded-full bg-zed-950" style={{ width: `${b.percent}%` }} />
 </div>
 <span className="w-8 text-right text-[rgba(48,37,34,0.62)]">{b.count}</span>
 </div>
 ))}
 </div>
 </div>
 )}

 <div className="mt-8 grid gap-10 lg:grid-cols-2">
 <div className="space-y-4">
 {reviews.length === 0 && (
  <p className="glass-panel rounded-zed border border-dashed border-white/50 px-5 py-8 text-sm text-[rgba(48,37,34,0.62)]">
  No reviews yet.
  </p>
 )}
 {reviews.slice(0, 6).map((r) => (
 <article key={r.id} className="glass-card rounded-zed p-5">
 <div className="flex items-center justify-between gap-3">
 <div className="flex items-center gap-2">
 <span className="grid size-9 place-items-center rounded-full bg-warm-white font-bold text-zed-700">
 {(r.user?.name ?? "ZED").charAt(0).toUpperCase()}
 </span>
 <div>
 <p className="text-sm font-semibold text-[var(--color-ink)]">{r.user?.name ?? "Verified customer"}</p>
 <div className="flex gap-0.5">
 {[1, 2, 3, 4, 5].map((s) => (
 <Star key={s} className={`size-3.5 ${s <= r.rating ? "fill-zed-950 text-zed-950" : "text-[rgba(48,37,34,0.62)]"}`} />
 ))}
 </div>
 </div>
 </div>
 <span className="text-xs text-[rgba(48,37,34,0.62)]">{r.createdAt.toLocaleDateString("en-KE", { month: "short", year: "numeric" })}</span>
 </div>
 {r.title && <p className="mt-3 font-semibold text-[var(--color-ink)]">{r.title}</p>}
 {r.comment && <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink)]">{r.comment}</p>}
 {r.verifiedPurchase && (
 <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-warm-white px-2.5 py-0.5 text-[11px] font-semibold text-zed-700">
 <Star className="size-3 fill-current" /> Verified purchase
 </p>
 )}
 </article>
 ))}
 </div>

 <div>
 <h3 className="font-display text-lg font-bold text-[var(--color-ink)]">Write a review</h3>
  <p className="mb-4 mt-1 text-sm text-[rgba(48,37,34,0.62)]">Reviews appear after approval.</p>
 <ReviewForm productId={product.id} />
 </div>
 </div>
 </section>

 {/* Related */}
 {related.length > 0 && (
 <section className="mt-16">
 <h2 className="font-display text-2xl font-bold text-[var(--color-ink)]">You may also love</h2>
 <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
 {related.map((p) => (
 <ProductCard key={p.id} product={p} />
 ))}
 </div>
 </section>
 )}
 </div>
 );
}