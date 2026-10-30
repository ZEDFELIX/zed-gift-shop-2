import "server-only";

import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Gift, Sparkles } from "lucide-react";
import { listProducts, type ProductListFilters } from "@/lib/data/products";
import { jsonLdItemList } from "@/lib/seo";
import { listCategories } from "@/lib/data/catalog";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { ShopFiltersMenu } from "@/components/shop/ShopFiltersMenu";
import { Pagination } from "@/components/shop/Pagination";
import { ShopSections, getShopSectionData, type ShopSection } from "@/components/shop/ShopSections";
import type { ReactNode } from "react";

const SORT_LABELS: Record<string, string> = {
  featured: "Featured",
  popular: "Most popular",
  new: "Newest",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  rating: "Top rated",
  name: "Name A-Z",
};

export async function ListingPage({
 title,
 filters,
  href,
  sidebar,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  filters: ProductListFilters;
  href: string;
  sidebar?: ReactNode;
}) {
  const [result, allCategories] = await Promise.all([
    listProducts(filters),
    listCategories(),
  ]);

  const occasions = allCategories
    .filter((c) => c.kind === "OCCASION")
    .map((c) => ({ slug: c.slug, name: c.name, count: c._count.products }));
  const recipients = allCategories
    .filter((c) => c.kind === "RECIPIENT")
    .map((c) => ({ slug: c.slug, name: c.name, count: c._count.products }));
  const categories = allCategories
    .filter((c) => c.kind === "CATEGORY")
    .map((c) => ({ slug: c.slug, name: c.name, count: c._count.products }));

  const nameBySlug = new Map(
    [...occasions, ...recipients, ...categories].map((c) => [c.slug, c.name])
  );

  const activeFilters = [
    filters.q ? `"${filters.q}"` : undefined,
    filters.category ? nameBySlug.get(filters.category) ?? filters.category : undefined,
    filters.occasion ? nameBySlug.get(filters.occasion) ?? filters.occasion : undefined,
    filters.recipient ? nameBySlug.get(filters.recipient) ?? filters.recipient : undefined,
    filters.collection ? filters.collection.replace(/-/g, " ") : undefined,
    filters.personalized ? "Personalized" : undefined,
    filters.inStock ? "In stock" : undefined,
    filters.flashSale ? "Flash sale" : undefined,
    filters.deals ? "On sale" : undefined,
    filters.bestSeller ? "Best sellers" : undefined,
    filters.sort && filters.sort !== "featured" ? SORT_LABELS[filters.sort] ?? filters.sort : undefined,
    filters.min != null ? `KES ${filters.min}+` : undefined,
    filters.max != null ? `up to KES ${filters.max}` : undefined,
  ].filter(Boolean);

  // Keep the current search/filter/sort state when changing pages. Previously
  // pagination linked to /shop?page=N and silently dropped active filters.
  const paginationParams = new URLSearchParams();
  const queryValues: Record<string, string | number | boolean | undefined> = {
    q: filters.q,
    category: filters.category,
    occasion: filters.occasion,
    recipient: filters.recipient,
    collection: filters.collection,
    min: filters.min,
    max: filters.max,
    personalized: filters.personalized ? "1" : undefined,
    inStock: filters.inStock ? "1" : undefined,
    flashSale: filters.flashSale ? "1" : undefined,
    deals: filters.deals ? "1" : undefined,
    bestSeller: filters.bestSeller ? "1" : undefined,
    sort: filters.sort && filters.sort !== "featured" ? filters.sort : undefined,
  };
  for (const [key, value] of Object.entries(queryValues)) {
    if (value !== undefined && value !== "" && value !== false) {
      paginationParams.set(key, String(value));
    }
  }

  const showSections = activeFilters.length === 0 && result.page <= 1;
  const sectionData: { sections: ShopSection[]; shownIds: string[] } = showSections
    ? await getShopSectionData()
    : { sections: [], shownIds: [] };
  const shownIds = new Set(sectionData.shownIds);
  const gridItems = result.items.filter((p) => !shownIds.has(p.id));

  return (
    <div className="container-zed py-3 sm:py-7 lg:py-9">
      {activeFilters.length > 0 && result.items.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              jsonLdItemList(
                result.items.map((p) => ({
                  name: p.name,
                  path: `/product/${p.slug}`,
                  image: p.images[0]?.url ?? null,
                })),
              ),
            ),
          }}
        />
      )}
      <div className={sidebar ? "lg:flex lg:items-start lg:gap-8" : undefined}>
        {sidebar ? <div className="hidden shrink-0 lg:block lg:w-60 xl:w-64">{sidebar}</div> : null}
        <div className="min-w-0 flex-1">
          <header className="mb-4 flex items-end justify-between gap-3 border-b border-[#eee6ed] pb-3 sm:mb-6 sm:gap-4 sm:pb-4">
            <div className="min-w-0 flex-1">
            </div>
            <div className="flex shrink-0 items-center justify-end gap-2">
              <Suspense fallback={null}>
                <ShopFiltersMenu
                  categories={categories}
                  occasions={occasions}
                  recipients={recipients}
                  minPrice={result.minPrice}
                  maxPrice={result.maxPrice}
                  sortLabels={SORT_LABELS}
                />
              </Suspense>
            </div>
          </header>

          <div className="mt-3 sm:mt-4">
            {showSections && (
              <>
                {/* Desktop-only merchandising: mobile storefront remains unchanged. */}
                <section className="relative mb-5 hidden overflow-hidden rounded-2xl border border-[#eadde8] bg-gradient-to-r from-[#fff7fb] via-[#f8eef5] to-[#f2e8f1] px-7 py-6 shadow-sm lg:flex lg:items-center lg:justify-between xl:px-9 xl:py-7">
                  <div className="pointer-events-none absolute -right-8 -top-16 size-64 rounded-full border-[28px] border-white/40" />
                  <div className="pointer-events-none absolute right-36 -bottom-24 size-52 rounded-full bg-white/35 blur-2xl" />
                  <div className="relative z-10 max-w-2xl">
                    <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#8a5578]"><Sparkles className="size-3.5" /> Thoughtful gifting starts here</p>
                    <h2 className="font-display text-2xl font-bold leading-tight tracking-tight text-[#2b2029] xl:text-3xl">Make every moment feel special.</h2>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#71616d]">Find a thoughtful gift for the people and moments that matter most.</p>
                    <Link href="/shop?sort=new" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-[#6B2D5C] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#542248] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B2D5C] focus-visible:ring-offset-2">Explore gifts <ArrowRight className="size-4" /></Link>
                  </div>
                  <div className="relative z-10 mr-8 hidden size-28 shrink-0 items-center justify-center rounded-[2rem] border border-white/80 bg-white/65 text-[#8a5578] shadow-sm xl:flex">
                    <Gift className="size-14 stroke-[1.25]" />
                  </div>
                </section>
                {occasions.length > 0 && (
                  <section className="mb-5 hidden lg:block">
                    <div className="mb-3 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#96758b]">Find the right moment</p>
                        <h2 className="mt-1 font-display text-lg font-bold text-[#241d23] xl:text-xl">Shop by occasion</h2>
                      </div>
                      <span className="text-xs text-[#857780]">A little something for every celebration</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 xl:grid-cols-4">
                      {occasions.slice(0, 4).map((occasion, index) => (
                        <Link key={occasion.slug} href={`/shop?occasion=${encodeURIComponent(occasion.slug)}`} className="group flex min-h-[88px] items-center justify-between gap-3 rounded-xl border border-[#eee5ec] bg-white/80 px-4 py-3 shadow-[0_2px_10px_rgba(48,28,43,0.03)] transition hover:-translate-y-0.5 hover:border-[#d9bfd2] hover:bg-[#fffafd] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a5578]">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className={`grid size-11 shrink-0 place-items-center rounded-xl text-sm font-bold ${index % 2 === 0 ? "bg-[#f5eaf2] text-[#794568]" : "bg-[#f7f0e8] text-[#8b6844]"}`}>{occasion.name.trim().slice(0, 1).toUpperCase()}</span>
                            <span className="min-w-0"><span className="block truncate text-sm font-bold text-[#342832] group-hover:text-[#6B2D5C]">{occasion.name}</span><span className="mt-1 block text-[11px] text-[#8a7d86]">{occasion.count} {occasion.count === 1 ? "gift" : "gifts"}</span></span>
                          </div>
                          <ArrowRight className="size-4 shrink-0 text-[#a58b9d] transition group-hover:translate-x-0.5 group-hover:text-[#6B2D5C]" />
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
            {showSections && <ShopSections sections={sectionData.sections} />}
            {gridItems.length > 0 ? (
              <div className="glass-panel rounded-2xl p-1.5 sm:p-3">
                <ProductGrid products={gridItems} />
              </div>
            ) : showSections ? null : (
              <ProductGrid products={[]} />
            )}
            {result.pages > 1 ? <Pagination
              page={result.page}
              pages={result.pages}
              total={result.total}
              pageSize={result.pageSize}
              href={href}
              query={paginationParams.toString()}
            /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
