import "server-only";

import Link from "next/link";
import { AlertCircle, Route, Star } from "lucide-react";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listPublicReviews, reviewStats } from "@/lib/data/reviews";
import { ReviewActions } from "@/components/reviews/ReviewActions";

export const dynamic = "force-dynamic";

type SearchParams = {
  page?: string;
  rating?: string;
  sort?: string;
  product?: string;
};

function link(target: Record<string, string | number | undefined>, label: string, current: boolean, extraClass = "") {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(target)) {
    if (value !== undefined && value !== "" && value !== null) params.set(key, String(value));
  }
  const qs = params.toString();
  return (
    <Link
      href={qs ? `/reviews?${qs}` : "/reviews"}
      className={`inline-flex min-h-9 items-center rounded-full border px-4 py-1.5 text-[13px] font-semibold transition-colors ${
        current
          ? "border-transparent bg-zed-950 text-white shadow-sm"
          : "border-edge bg-white text-charcoal/70 hover:border-charcoal/30 hover:text-charcoal"
      } ${extraClass}`}
    >
      {label}
    </Link>
  );
}

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const page = Math.max(1, Math.round(Number(sp.page) || 1));
  const rating = [1, 2, 3, 4, 5].includes(Number(sp.rating)) ? Number(sp.rating) : undefined;
  const sort = sp.sort === "helpful" ? ("helpful" as const) : ("newest" as const);
  const productSlug = sp.product?.trim() || undefined;
  const perPage = 8;

  try {
    const [stats, listing] = await Promise.all([
      reviewStats(),
      listPublicReviews({ rating, productSlug, sort, page, perPage }),
    ]);

    let productFilter: { name: string } | null = null;
    let filterableProducts: { name: string; slug: string }[] = [];
    if (productSlug) {
      productFilter = await prisma.product.findUnique({
        where: { slug: productSlug },
        select: { name: true },
      });
    }
    const grouped = await prisma.review.groupBy({
      by: ["productId"],
      where: { status: "APPROVED" },
      _count: { productId: true },
    });
    if (grouped.length > 0) {
      const products = await prisma.product.findMany({
        where: { id: { in: grouped.map((g) => g.productId) } },
        select: { name: true, slug: true },
        orderBy: { name: "asc" },
      });
      filterableProducts = products;
    }

    const session = await getSession();
    const signedIn = Boolean(session?.sub);

    const baseTarget: Record<string, string | number | undefined> = {
      rating: rating,
      sort: sort === "helpful" ? "helpful" : undefined,
      product: productSlug,
    };

    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <p className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-[12px] font-bold uppercase tracking-wide text-rose-700">
          <Route className="size-3.5" /> Customer reviews
        </p>
        <h1 className="mt-3 font-display text-3xl font-black text-zed-950 sm:text-4xl">
          What Kenyans say about ZED
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[rgba(48,37,34,0.62)]">
          Every review below was written by a real shopper - guests and account holders alike - and it
          appears here only after our team approves it. Purchases are confirmed by the store before the
          &quot;Verified purchase&quot; badge is shown.
        </p>

        {/* Summary card */}
        <div className="mt-8 glass-panel rounded-zed p-6 sm:p-8">
          <div className="grid gap-8 sm:grid-cols-[190px_1fr]">
            <div>
              <p className="font-display text-6xl font-black text-zed-950">{stats.average.toFixed(1)}</p>
              <div className="mt-2 flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`size-5 ${s <= Math.round(stats.average) ? "fill-zed-950 text-zed-950" : "text-[rgba(48,37,34,0.35)]"}`}
                  />
                ))}
              </div>
              <p className="mt-2 text-sm text-[rgba(48,37,34,0.62)]">
                {stats.total} review{stats.total === 1 ? "" : "s"}
              </p>
              {stats.verifiedCount > 0 && (
                <p className="mt-1 text-[12px] font-semibold text-zed-700">
                  {stats.verifiedCount} with verified purchase
                </p>
              )}
            </div>
            <div className="space-y-2">
              {stats.buckets.map((b) => (
                <div key={b.star} className="flex items-center gap-3 text-xs">
                  <span className="w-8 font-semibold text-charcoal/70">{b.star}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/70">
                    <div className="h-full rounded-full bg-zed-950" style={{ width: `${b.percent}%` }} />
                  </div>
                  <span className="w-10 text-right text-charcoal/55">{b.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-8 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-bold uppercase tracking-wide text-charcoal/45">Filter by rating</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {link({ sort: baseTarget.sort, product: baseTarget.product }, "All", !rating)}
              {[5, 4, 3, 2, 1].map((star) =>
                link(
                  { ...baseTarget, rating: star },
                  `${star} star`,
                  rating === star,
                ),
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-bold uppercase tracking-wide text-charcoal/45">Sort</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {link({ ...baseTarget, sort: undefined }, "Newest first", sort === "newest")}
              {link({ ...baseTarget, sort: "helpful" }, "Most helpful", sort === "helpful")}
            </div>
          </div>

          {filterableProducts.length > 0 && (
            <form action="/reviews" method="get" className="flex flex-wrap items-center gap-2">
              {rating !== undefined && <input type="hidden" name="rating" value={String(rating)} />}
              {sort === "helpful" && <input type="hidden" name="sort" value="helpful" />}
              <label htmlFor="reviews-product" className="text-[12px] font-bold uppercase tracking-wide text-charcoal/45">
                Product
              </label>
              <select
                id="reviews-product"
                name="product"
                defaultValue={productSlug ?? ""}
                className="min-h-9 rounded-md border border-edge bg-white px-3 py-1.5 text-[13px] text-charcoal"
              >
                <option value="">All products</option>
                {filterableProducts.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="min-h-9 rounded-md bg-zed-950 px-4 py-1.5 text-[13px] font-bold text-white hover:bg-zed-900"
              >
                Apply
              </button>
              {productSlug && (
                <Link
                  href="/reviews"
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-charcoal/60 underline underline-offset-4 hover:text-charcoal"
                >
                  Clear product filter
                </Link>
              )}
            </form>
          )}
        </div>

        {/* List */}
        {listing.reviews.length === 0 ? (
          <div className="mt-10 glass-panel rounded-zed px-6 py-12 text-center">
            {stats.total === 0 ? (
              <>
                <p className="font-display text-lg font-bold text-zed-950">No reviews yet</p>
                <p className="mx-auto mt-2 max-w-md text-sm text-[rgba(48,37,34,0.62)]">
                  Be the first! After checkout you will get a review form for the gift you bought.
                </p>
              </>
            ) : rating ? (
              <>
                <p className="font-display text-lg font-bold text-zed-950">No reviews match your filter</p>
                <p className="mx-auto mt-2 max-w-md text-sm text-[rgba(48,37,34,0.62)]">
                  Try a different star rating or clear the filter to see all {stats.total} reviews.
                </p>
                <div className="mt-4">
                  {link({ sort: baseTarget.sort, product: baseTarget.product }, "Clear filters", false)}
                </div>
              </>
            ) : (
              <>
                <p className="font-display text-lg font-bold text-zed-950">Nothing matched</p>
                <div className="mt-4">
                  {link({ sort: baseTarget.sort, product: baseTarget.product }, "Clear filters", false)}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="mt-8">
            {productFilter && (
              <p className="mb-4 text-[13px] font-semibold text-charcoal/70">
                Showing reviews for <span className="text-zed-950">{productFilter.name}</span>
              </p>
            )}
            <div className="space-y-4">
              {listing.reviews.map((r) => (
                <article key={r.id} className="glass-card rounded-zed p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="grid size-9 place-items-center rounded-full bg-warm-white font-bold text-zed-700">
                        {r.authorName.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-ink)]">{r.authorName}</p>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`size-3.5 ${s <= r.rating ? "fill-zed-950 text-zed-950" : "text-[rgba(48,37,34,0.62)]"}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-[rgba(48,37,34,0.62)]">
                      {r.createdAt.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  {r.title && <p className="mt-3 font-semibold text-[var(--color-ink)]">{r.title}</p>}
                  {r.comment && <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink)]">{r.comment}</p>}
                  <p className="mt-2 text-[13px] font-semibold text-zed-700">
                    <Link href={`/product/${r.productSlug}`} className="hover:underline">
                      About: {r.productName}
                    </Link>
                  </p>
                  {r.images.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {r.images.map((src, i) => (
                        <a key={src} href={src} target="_blank" rel="noopener noreferrer" className="block">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={src}
                            alt={`${r.productName} review photo ${i + 1}`}
                            loading="lazy"
                            className="size-20 rounded-lg object-cover ring-1 ring-black/10 transition-transform hover:scale-105"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                  {r.verifiedPurchase && (
                    <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-warm-white px-2.5 py-0.5 text-[11px] font-semibold text-zed-700">
                      <Star className="size-3 fill-current" /> Verified purchase
                    </p>
                  )}
                  <ReviewActions reviewId={r.id} initialHelpful={r.helpfulCount} signedIn={signedIn} />
                </article>
              ))}
            </div>

            {listing.pageCount > 1 && (
              <div className="mt-8 flex items-center justify-between">
                {page > 1 ? (
                  link({ ...baseTarget, page: page - 1 }, "Newer reviews", false)
                ) : (
                  <span />
                )}
                <p className="text-xs text-[rgba(48,37,34,0.62)]">
                  Page {Math.min(page, listing.pageCount)} of {listing.pageCount}
                </p>
                {page < listing.pageCount ? (
                  link({ ...baseTarget, page: page + 1 }, "Older reviews", false)
                ) : (
                  <span />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  } catch {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <AlertCircle className="mx-auto size-8 text-rose-500" />
        <h1 className="mt-3 font-display text-xl font-bold text-zed-950">We could not load reviews</h1>
        <p className="mt-2 text-sm text-[rgba(48,37,34,0.62)]">
          Please refresh the page in a moment.
        </p>
      </div>
    );
  }
}
