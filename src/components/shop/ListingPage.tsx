import "server-only";

import { Suspense } from "react";
import { listProducts, type ProductListFilters } from "@/lib/data/products";
import { listCategories } from "@/lib/data/catalog";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { ShopControls } from "@/components/shop/ShopControls";
import { ShopSearch } from "@/components/shop/ShopSearch";
import { Pagination } from "@/components/shop/Pagination";
import { ShopSections } from "@/components/shop/ShopSections";

const SORT_LABELS: Record<string, string> = {
  featured: "Featured",
  new: "Newest",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  rating: "Top rated",
  name: "Name A-Z",
};

export async function ListingPage({
  title,
  eyebrow,
  description,
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
    filters.min != null ? `KES ${filters.min}+` : undefined,
    filters.max != null ? `up to KES ${filters.max}` : undefined,
  ].filter(Boolean);

  return (
    <div className="container-zed py-5 sm:py-7 lg:py-9">
      <header className="mb-4 max-w-xl sm:mb-5">
        
        <h1 className="font-display text-2xl font-bold text-[var(--color-ink)] sm:text-3xl">
          {title}
        </h1>
        {false && description ? (
          <p className="mt-2.5 max-w-xl text-[15px] leading-6 text-[var(--color-ink)]/80 sm:mt-3 sm:text-base sm:leading-relaxed">
            {description}
          </p>
        ) : null}
        <p className="mt-1 text-xs text-[rgba(48,37,34,0.62)]">
          {result.total} gift{result.total === 1 ? "" : "s"} available
        </p>
      </header>

      <div className="mb-4 sm:mb-5">
        <ShopSearch initialValue={filters.q ?? ""} />
      </div>

      {activeFilters.length > 0 && (
        <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar sm:mb-5 sm:flex-wrap">
          <span className="mr-1 shrink-0 self-center text-[10px] font-semibold uppercase tracking-[0.12em] text-[rgba(48,37,34,0.62)]">
            Filtered by
          </span>
          {activeFilters.map((filter) => (
            <span
              key={filter}
              className="shrink-0 rounded-full glass-panel border border-white/60 px-2.5 py-1 text-[11px] font-medium text-[var(--color-ink)]"
            >
              {filter}
            </span>
          ))}
        </div>
      )}

      {/* Mobile controls sit above the product grid. Desktop controls become the sidebar. */}
      <div className="lg:flex lg:items-start lg:gap-5">
        <Suspense fallback={null}>
          <ShopControls
            categories={categories}
            occasions={occasions}
            recipients={recipients}
            minPrice={result.minPrice}
            maxPrice={result.maxPrice}
            sortLabels={SORT_LABELS}
          />
        </Suspense>

        <div className="mt-4 min-w-0 flex-1 lg:mt-0">
          {activeFilters.length === 0 ? <ShopSections /> : <ProductGrid products={result.items} />}
          {activeFilters.length > 0 ? <Pagination
            page={result.page}
            pages={result.pages}
            total={result.total}
            pageSize={result.pageSize}
            href={href}
          /> : null}
        </div>
      </div>
    </div>
  );
}