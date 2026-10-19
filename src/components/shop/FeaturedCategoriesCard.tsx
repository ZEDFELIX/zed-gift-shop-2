import Link from "next/link";
import { getDealProducts, type ProductWithRelations } from "@/lib/data/products";
import { formatKES } from "@/lib/utils";

function Price({ product }: { product: ProductWithRelations }) {
 const compareAt = product.compareAtPrice;
 const onSale = compareAt != null && compareAt > product.price;
 return (
 <p className="mt-1 text-center text-sm">
 {onSale && compareAt != null && (
 <span className="mr-1.5 text-[rgba(48,37,34,0.62)] line-through">{formatKES(compareAt)}</span>
 )}
 <span className={`font-bold ${onSale ? "text-red-600" : "text-[#07111F]"}`}>{formatKES(product.price)}</span>
 </p>
 );
}

/** Sidebar "Featured Categories" card — a vertical list of on-sale gift picks. */
export async function FeaturedCategoriesCard() {
 const deals = await getDealProducts(4);

 if (deals.length === 0) return null;

 return (
 <aside
 className="w-full rounded-2xl border border-dashed border-[#D9A441] bg-white p-5 shadow-sm"
 aria-label="Featured categories"
 >
 <h2 className="font-display text-xl font-bold leading-none text-[#C24B80]">Featured Categories</h2>
 <ul className="mt-2">
 {deals.map((product) => (
 <li key={product.id} className="border-b border-dashed border-black/10 last:border-b-0">
 <Link href={`/product/${product.slug}`} className="group block py-4">
 <div className="mx-auto w-full max-w-[180px] overflow-hidden rounded-xl bg-black/5">
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img
 src={product.images[0]?.url ?? ""}
 alt={product.name}
 loading="lazy"
 className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
 />
 </div>
 <p className="mt-3 text-center font-display text-sm font-semibold leading-snug text-[#07111F]">
 {product.name}
 </p>
 <Price product={product} />
 </Link>
 </li>
 ))}
 </ul>
 </aside>
 );
}
