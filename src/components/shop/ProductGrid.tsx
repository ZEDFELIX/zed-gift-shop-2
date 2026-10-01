import "server-only";

import { ProductCard } from "@/components/product/ProductCard";
import type { ProductWithRelations } from "@/lib/data/products";

export function ProductGrid({
 products,
 wishlistIds = [],
}: {
 products: ProductWithRelations[];
 wishlistIds?: string[];
}) {
 if (products.length === 0) {
   return (
     <div className="rounded-zed border border-dashed border-edge-strong px-6 py-16 text-center">
       <p className="font-display text-lg font-bold text-[#07111F]">No gifts match your filters</p>
       <p className="mt-1 text-sm text-[#334155]">
         Try adjusting your search or browse all gifts instead.
       </p>
     </div>
   );
 }

 return (
   <div className="grid grid-cols-2 gap-3 sm:gap-x-6 sm:gap-y-8 lg:grid-cols-3 xl:grid-cols-4">
     {products.map((product) => (
       <ProductCard
         key={product.id}
         product={product}
         inWishlist={wishlistIds.includes(product.id)}
       />
     ))}
   </div>
 );
}