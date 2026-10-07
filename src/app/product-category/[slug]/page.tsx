import "server-only";

import Link from "next/link";
import Image from "next/image";
import { listProducts } from "@/lib/data/products";
import { formatKES } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
 const { slug } = await params;
 return {
  title: `ZED Gift Shop - ${slug}`,
  description: "ZED Gift Shop category page",
 };
}

export default async function ProductCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
 const { slug } = await params;

 const where = {
  categories: { some: { categoryId: { contains: slug, mode: "insensitive" } } },
  status: "ACTIVE",
 };

 const { items, total, minPrice, maxPrice } = await listProducts({
  q: undefined,
  category: undefined,
  occasion: undefined,
  recipient: undefined,
  collection: undefined,
  min: undefined,
  max: undefined,
  personalized: undefined,
  inStock: undefined,
  deals: undefined,
  rating: undefined,
  sort: "featured",
  page: 1,
  pageSize: 24,
 });

 return (
  <div className="container-zed py-14 lg:py-20">
   <header className="max-w-3xl mx-auto mb-6">
    <h1 className="font-display text-4xl lg:text-5xl font-bold text-charcoal">
     {slug}
    </h1>
    <p className="mt-2 text-lg text-charcoal/70">
     Gifts categorized under {slug}
    </p>
   </header>

   <section className="mt-8">
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
     {items.map((product) => (
      <Link
       key={product.id}
       href={`/product/${product.slug}`}
       className="glass-card aspect-[4/5] overflow-hidden rounded-xl transition-transform hover:scale-105 group"
       style={{ backgroundImage: product.images[0] ? `url(${product.images[0].url})` : "url(/placeholders/product-01.jpg)" }}
      >
       <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-charcoal/70"></span>
       <span className="absolute inset-x-3 bottom-3 text-center font-display text-xs font-bold text-white">{product.name}</span>
      </Link>
     ))}
    </div>
   </section>
  </div>
 );
}