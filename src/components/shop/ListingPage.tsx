import "server-only";

import { Suspense } from "react";
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
    listProducts({ ...filters, pageSize: 4 }),
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
  // Keep the main product listing to exactly four items per page. Featured sections
  // may repeat a product, but must not silently reduce the paginated grid count.
  const gridItems = result.items;

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
          <header className="mb-4 flex items-center justify-between gap-2 sm:mb-5 sm:gap-3">
            <h1 className="min-w-0 flex-1 break-words font-display text-xl font-bold leading-tight text-[var(--color-ink)] sm:text-3xl">
              {title}
            </h1>
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
