import "server-only";

import { Suspense } from "react";
import { listProducts, type ProductListFilters } from "@/lib/data/products";
import { jsonLdItemList } from "@/lib/seo";
import { listCategories } from "@/lib/data/catalog";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { ShopSearch } from "@/components/shop/ShopSearch";
import { ShopFiltersMenu } from "@/components/shop/ShopFiltersMenu";
import { Pagination } from "@/components/shop/Pagination";
import { ShopSections } from "@/components/shop/ShopSections";
import { FeaturedCategories } from "@/components/shop/FeaturedCategories";

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
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  filters: ProductListFilters;
  href: string;
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
      <header className="mb-3 flex items-center justify-between gap-2 sm:mb-5 sm:gap-3">
        <h1 className="min-w-0 break-words font-display text-xl font-bold leading-tight text-[var(--color-ink)] sm:text-3xl">
          {title}
        </h1>
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
      </header>

      <div className="mb-3 sm:mb-5">
        {(href !== "/shop" || activeFilters.length > 0) && <ShopSearch initialValue={filters.q ?? ""} />}
      </div>

      <div className="mt-3 min-w-0 flex-1 sm:mt-4 lg:mt-0">
        {activeFilters.length === 0 && result.page <= 1 && (
 <>
 <FeaturedCategories />
 <ShopSections />
 </>
 )}
        <ProductGrid products={result.items} />
        {result.pages > 1 ? <Pagination
          page={result.page}
          pages={result.pages}
          total={result.total}
          pageSize={result.pageSize}
          href={href}
        /> : null}
      </div>
    </div>
  );
}