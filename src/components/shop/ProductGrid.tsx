import "server-only";

import { ProductCard } from "@/components/product/ProductCard";
import type { ProductWithRelations } from "@/lib/data/products";

export function ProductGrid({ products }: { products: ProductWithRelations[] }) {
  if (products.length === 0) return <div className="rounded-zed border border-dashed border-edge-strong px-6 py-16 text-center"><p className="font-display text-lg font-bold text-[#07111F]">No gifts match your filters</p><p className="mt-1 text-sm text-[#334155]">Try adjusting your search or browse all gifts instead.</p></div>;
  return <div className="grid min-w-0 grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4 lg:gap-5">{products.map((product, index) => <ProductCard key={product.id} product={product} priority={index < 2} />)}</div>;
}