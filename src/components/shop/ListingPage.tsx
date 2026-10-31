import "server-only";

import { Suspense } from "react";
import Link from "next/link";
import { listProducts, type ProductListFilters } from "@/lib/data/products";
import { jsonLdItemList } from "@/lib/seo";
import { listCategories } from "@/lib/data/catalog";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { ShopFiltersMenu } from "@/components/shop/ShopFiltersMenu";
import { Pagination } from "@/components/shop/Pagination";
import { ShopSections, getShopSectionData, type ShopSection } from "@/components/shop/ShopSections";
import { RecentlyViewed } from "@/components/shop/RecentlyViewed";
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
    <div className="container-zed bg-[#f7f7f7] py-2 sm:bg-transparent sm:py-5 lg:py-6">
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
          <header className="mb-4 hidden items-end justify-between gap-3 border-b border-[#eee6ed] pb-3 sm:mb-6 sm:flex sm:gap-4 sm:pb-4">
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

          <div className="mt-1 sm:mt-3">
            {showSections && categories.length > 0 && (
              <section className="mb-4 sm:hidden">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-extrabold text-[#252525]">Categories</h2>
                  <Link href="/shop" className="text-[10px] font-semibold text-[#8aa83d]">See all</Link>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {categories.filter((category) => category.count > 0).slice(0, 10).map((category, index) => (
                    <Link key={category.slug} href={"/shop?category=" + encodeURIComponent(category.slug)} className="flex h-[54px] min-w-[88px] shrink-0 items-center justify-between gap-1 overflow-hidden rounded-xl border border-[#e8e8e8] bg-white px-2 shadow-sm">
                      <span className="max-w-[54px] text-[10px] font-bold leading-tight text-[#343434]">{category.name}</span>
                      <span className={"grid size-8 shrink-0 place-items-center rounded-lg text-xs font-black " + (index % 3 === 0 ? "bg-[#eef4df] text-[#72952e]" : index % 3 === 1 ? "bg-[#f8eaf0] text-[#b35a7b]" : "bg-[#edf0f5] text-[#65748b]")}>{category.name.slice(0,1).toUpperCase()}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            {showSections && <RecentlyViewed />}
            {showSections && <ShopSections sections={sectionData.sections} />}
            {gridItems.length > 0 ? (
              <div className="rounded-2xl bg-transparent p-0 sm:glass-panel sm:p-3">
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
