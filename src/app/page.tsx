import "server-only";

import Link from "next/link";
import { ArrowRight, Lock, ShieldCheck, Star, Truck } from "lucide-react";

import {
  HOMEPAGE_BLOG,
  OCCASION_CARDS,
  RECIPIENT_CARDS,
  SEO_BLOCK_SECTIONS,
  SITE,
  TESTIMONIALS,
  TRUST_POINTS,
} from "@/lib/constants";
import {
  getBestSellerProducts,
  getDealProducts,
  getFeaturedProducts,
  listProducts,
} from "@/lib/data/products";
import { buildMetadata } from "@/lib/seo";
import { FlashSaleCountdown } from "@/components/home/FlashSaleCountdown";
import { ProductCard } from "@/components/product/ProductCard";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Gift Shop Near Me \u2013 ZED Gift Shop 2 Nairobi CBD Kenya",
  path: "/",
  description:
    "Gift Shop Near Me, at ZED Gift Shop 2 is the perfect place to find something special and thoughtful for someone you care about.",
});

const TRUST_ICONS = [ShieldCheck, Truck, Lock] as const;

function positiveInt(value: string | string[] | undefined, fallback: number) {
  const v = Array.isArray(value) ? value[0] : value;
  const n = Number(v);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : fallback;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const newPage = positiveInt(sp["product-page"], 1);
  const bestPage = positiveInt(sp["best-page"], 1);

  const [featured, bestSellers, deals, gridA, gridB] = await Promise.all([
    getFeaturedProducts(10).catch(() => []),
    getBestSellerProducts(6).catch(() => []),
    getDealProducts(5).catch(() => []),
    listProducts({ page: newPage, pageSize: 12, sort: "newest" }).catch(() => null),
    listProducts({ page: bestPage, pageSize: 5, sort: "rating" }).catch(() => null),
  ]);

  const newArrivals = gridA?.items ?? [];
  const topRated = gridB?.items ?? [];
  const newArrivalPages = gridA?.pages ?? 1;
  const topRatedPages = gridB?.pages ?? 1;

  return (
    <>
      <div className="container-zed">
        {/* Featured Categories */}
        {featured.length > 0 && (
          <section className="py-8 lg:py-10">
            <SectionHeading
              eyebrow="Featured Categories"
              title="Featured gifts this week"
              href="/shop"
              linkLabel="Shop all"
            />
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* Trust bar */}
        <section className="py-8 lg:py-10">
          <div className="grid gap-4 sm:grid-cols-3">
            {TRUST_POINTS.map((point, i) => {
              const Icon = TRUST_ICONS[i] ?? ShieldCheck;
              return (
                <div
                  key={point.title}
                  className="rounded-zed border border-edge bg-panel/50 p-6"
                >
                  <span className="grid size-11 place-items-center rounded-full bg-deep-olive text-white">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-display text-base font-bold text-deep-olive">
                    {point.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-charcoal/75">{point.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* New Arrivals */}
        {newArrivals.length > 0 && (
          <section className="py-8 lg:py-10">
            <SectionHeading eyebrow="New Arrivals" title="New Arrivals" />
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {newArrivals.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            <Pagination
              page={newPage}
              pages={newArrivalPages}
              makeHref={(n) => `/?product-page=${n}`}
            />
          </section>
        )}

        {/* Top rated */}
        {topRated.length > 0 && (
          <section className="py-8 lg:py-10">
            <SectionHeading eyebrow="Best Sellers" title="Best Sellers" />
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
              {topRated.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            <Pagination
              page={bestPage}
              pages={topRatedPages}
              makeHref={(n) => `/?best-page=${n}`}
            />
          </section>
        )}

        {/* Flash Sales */}
        {deals.length > 0 && (
          <section className="rounded-zed border border-edge bg-gradient-to-r from-panel to-warm-ivory py-8 lg:py-10">
            <div className="px-6 lg:px-10">
              <FlashSaleCountdown />
              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
                {deals.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Best Selling Products */}
        {bestSellers.length > 0 && (
          <section className="py-8 lg:py-10">
            <SectionHeading eyebrow="Best Sellers" title="Best Selling Products" />
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
              {bestSellers.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* Occasion categories */}
        <section className="py-8 lg:py-10">
          <SectionHeading
            eyebrow="Shop by occasion"
            title="Gifts for every occasion"
            href="/gifts"
            linkLabel="Browse all"
          />
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            {OCCASION_CARDS.map((c) => (
              <Link
                key={c.title}
                href={c.href}
                className="group relative aspect-[4/5] overflow-hidden rounded-zed bg-warm-ivory"
              >
                <span
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${c.image})` }}
                  aria-hidden
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" aria-hidden />
                <span className="absolute inset-x-3 bottom-3 font-display text-sm font-bold text-white">
                  {c.title}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Recipient categories */}
        <section className="py-8 lg:py-10">
          <SectionHeading
            eyebrow="Who are you shopping for?"
            title="Gifts by recipient"
            href="/gifts"
            linkLabel="Browse all"
          />
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            {RECIPIENT_CARDS.map((r) => (
              <Link
                key={r.title}
                href={r.href}
                className="group overflow-hidden rounded-zed border border-edge bg-white"
              >
                <span className="block aspect-square overflow-hidden bg-warm-ivory">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.image}
                    alt={r.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </span>
                <span className="block px-4 py-4 font-display text-sm font-bold text-[var(--color-ink)]">
                  {r.title}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Customer Feedback & Reviews */}
        <section className="py-8 lg:py-10">
          <SectionHeading
            eyebrow="Customer Feedback & Reviews"
            title="What our customers say"
          />
          <div className="mt-6 rounded-zed border border-edge bg-panel/50 p-6 text-center">
            <p className="font-display text-3xl font-black uppercase tracking-wide text-deep-olive">
              Excellent
            </p>
            <p className="mt-1.5 text-sm text-charcoal/70">
              Based on {SITE.reviewCount} reviews
            </p>
            <div className="mt-3 flex items-center justify-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-5 fill-champagne text-champagne" />
              ))}
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TESTIMONIALS.slice(0, 4).map((t) => (
              <figure
                key={t.author}
                className="flex h-full flex-col rounded-zed border border-edge bg-white p-5"
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3.5 fill-champagne text-champagne" />
                  ))}
                </div>
                <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-charcoal/80">
                  &ldquo;{t.text}&rdquo;
                </blockquote>
                <figcaption className="mt-4 text-sm font-semibold text-deep-olive">
                  {t.author}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* Blog */}
        <section className="py-8 lg:py-10">
          <SectionHeading eyebrow="Blog" title="Gift guides & ideas" href="/blog" linkLabel="Read the blog" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {HOMEPAGE_BLOG.slice(0, 6).map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="flex flex-col rounded-zed border border-edge bg-white p-5 transition-colors hover:border-soft-sage"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-soft-sage">
                  {post.category}
                </p>
                <h3 className="mt-2 font-display text-base font-bold leading-snug text-[var(--color-ink)]">
                  {post.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-charcoal/75">
                  {post.excerpt}
                </p>
                <p className="mt-4 text-xs text-charcoal/60">{post.readTime} read</p>
              </Link>
            ))}
          </div>
        </section>

        {/* SEO text block */}
        <section className="border-t border-edge py-10">
          <h1 className="text-2xl font-bold text-[var(--color-ink)] lg:text-3xl">
            Gift Shop Nairobi | Personalized &amp; Same-Day Gifts | {SITE.name}
          </h1>
          <h2 className="mt-3 text-xl font-bold text-[var(--color-ink)] lg:text-2xl">
            Gift Shop in Nairobi &ndash; Personalized Gifts &amp; Same-Day Delivery
          </h2>
          <div className="mt-6 space-y-6">
            {SEO_BLOCK_SECTIONS.map((s) => (
              <div key={s.heading}>
                <h3 className="text-base font-bold text-deep-olive">{s.heading}</h3>
                <p className="mt-2 text-sm leading-relaxed text-charcoal/75">{s.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function SectionHeading({
  eyebrow,
  title,
  href,
  linkLabel,
}: {
  eyebrow: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-1 font-display text-2xl font-bold text-[var(--color-ink)] lg:text-3xl">
          {title}
        </h2>
      </div>
      {href && linkLabel ? (
        <Link
          href={href}
          className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-deep-olive hover:text-soft-sage sm:flex"
        >
          {linkLabel}
          <ArrowRight className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}

function Pagination({
  page,
  pages,
  makeHref,
}: {
  page: number;
  pages: number;
  makeHref: (page: number) => string;
}) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-1.5">
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
        <Link
          key={n}
          href={makeHref(n)}
          aria-current={n === page ? "page" : undefined}
          className={`grid size-9 place-items-center rounded-md border text-sm font-semibold transition-colors ${
            n === page
              ? "border-deep-olive bg-deep-olive text-white"
              : "border-edge bg-white text-charcoal hover:border-soft-sage"
          }`}
        >
          {n}
        </Link>
      ))}
    </nav>
  );
}
