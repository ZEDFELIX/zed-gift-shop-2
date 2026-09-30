import "server-only";

import { Suspense } from "react";
import { listProducts, type ProductListFilters } from "@/lib/data/products";
import { listCategories } from "@/lib/data/catalog";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { ShopControls } from "@/components/shop/ShopControls";
import { ShopSearch } from "@/components/shop/ShopSearch";
import { Pagination } from "@/components/shop/Pagination";

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
   [...occasions, ...recipients, ...categories].map((c) => [c.slug, c.name]),
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
   <div className="container-zed py-7 sm:py-10 lg:py-14">
     <header className="mb-5 max-w-2xl sm:mb-6">
       {eyebrow && <p className="eyebrow">{eyebrow}</p>}
       <h1 className="mt-2 font-display text-3xl font-bold text-[var(--color-ink)] sm:text-4xl">
         {title}
       </h1>
       {description ? (
         <p className="mt-2.5 max-w-xl text-[15px] leading-6 text-[var(--color-ink)]/80 sm:mt-3 sm:text-base sm:leading-relaxed">
           {description}
         </p>
       ) : null}
       <p className="mt-2.5 text-sm text-[rgba(48,37,34,0.62)]">
         {result.total} gift{result.total === 1 ? "" : "s"} available
       </p>
     </header>

     <div className="mb-5 sm:mb-8">
       <ShopSearch initialValue={filters.q ?? ""} />
     </div>

     {activeFilters.length > 0 && (
       <div className="mb-5 flex gap-2 overflow-x-auto pb-1 no-scrollbar sm:mb-6 sm:flex-wrap">
         <span className="mr-1 shrink-0 self-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgba(48,37,34,0.62)]">
           Filtered by
         </span>
         {activeFilters.map((filter) => (
           <span
             key={filter}
             className="shrink-0 rounded-full glass-panel border border-white/60 px-3 py-1.5 text-xs font-medium text-[var(--color-ink)]"
           >
             {filter}
           </span>
         ))}
       </div>
     )}

     {/* Mobile controls sit above the product grid. Desktop controls become the sidebar. */}
     <div className="lg:flex lg:items-start lg:gap-8">
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

       <div className="mt-5 min-w-0 flex-1 lg:mt-0">
         <ProductGrid products={result.items} />
         <Pagination
           page={result.page}
           pages={result.pages}
           total={result.total}
           pageSize={result.pageSize}
           href={href}
         />
       </div>
     </div>
   </div>
 );
}