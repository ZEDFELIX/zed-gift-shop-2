import Image from "next/image";
import Link from "next/link";
import { type ProductWithRelations } from "@/lib/data/products";
import { formatKES } from "@/lib/utils";

function Price({ product }: { product: ProductWithRelations }) {
 const compareAt = product.compareAtPrice;
 const onSale = compareAt != null && compareAt > product.price;
 return (
  <p className="mt-1 text-center text-sm">
   {onSale && compareAt != null && <span className="mr-1.5 text-[var(--zed-text-muted)] line-through">{formatKES(compareAt)}</span>}
   <span className="font-bold text-[var(--zed-brand-primary)]">{formatKES(product.price)}</span>
  </p>
 );
}

/** Compact desktop rail of live featured products. */
export function FeaturedCategoriesCard({ products }: { products: ProductWithRelations[] }) {
 const deals = products.slice(0, 4);
 if (deals.length === 0) return null;

 return (
  <aside className="w-full rounded-2xl border border-[var(--zed-brand-secondary)]/15 bg-white p-4 shadow-sm" aria-label="Featured gifts">
   <h2 className="font-display text-base font-bold leading-none text-[var(--zed-text-heading)]">Featured gifts</h2>
   <ul className="mt-2">
    {deals.map((product) => (
     <li key={product.id} className="border-b border-[var(--zed-brand-secondary)]/10 last:border-b-0">
      <Link href={`/product/${product.slug}`} className="group block py-3">
       <div className="relative mx-auto aspect-square w-full max-w-[180px] overflow-hidden rounded-xl bg-[var(--zed-brand-background)]">
        {product.images[0]?.url ? <Image src={product.images[0].url} alt={product.name} fill sizes="180px" unoptimized className="object-contain p-2 transition-transform duration-300 group-hover:scale-[1.03]" /> : <div className="grid size-full place-items-center text-xs font-bold text-[var(--zed-text-muted)]">ZED</div>}
       </div>
       <p className="mt-2 text-center font-display text-sm font-semibold leading-snug text-[var(--zed-text-heading)]">{product.name}</p>
       <Price product={product} />
      </Link>
     </li>
    ))}
   </ul>
  </aside>
 );
}
