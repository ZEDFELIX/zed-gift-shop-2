import Link from "next/link";
import { ProductCard } from "@/components/product/ProductCard";
import { FlashSaleCountdown } from "@/components/shop/FlashSaleCountdown";
import {
  getBestSellerProducts,
  getDealProducts,
  getFeaturedProducts,
  getFlashSaleProducts,
  getMostBoughtProducts,
  type ProductWithRelations,
} from "@/lib/data/products";
import { prisma } from "@/lib/prisma";

type SectionProps = { title: string; products: ProductWithRelations[]; href?: string; flash?: boolean };

function Section({ title, products, href, flash = false }: SectionProps) {
  if (!products.length) return null;
  return (
    <section className="mb-9 sm:mb-11">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-display text-xl font-bold text-[var(--color-ink)] sm:text-2xl">{title}</h2>
        <div className="flex min-w-0 items-center gap-2">
          {flash && <FlashSaleCountdown />}
          {href && <Link href={href} className="shrink-0 text-xs font-semibold text-rose-600 hover:text-rose-700">View all</Link>}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-3">
        {products.slice(0, 3).map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  );
}

export async function ShopSections() {
  const [flashSale, sale, mostBought, bestSellers, newArrivals, personalized, corporateCategory] = await Promise.all([
    getFlashSaleProducts(6), getDealProducts(6), getMostBoughtProducts(6), getBestSellerProducts(6), getFeaturedProducts(6),
    prisma.product.findMany({ where: { status: "ACTIVE", personalizationEnabled: true }, include: { images: { orderBy: { sortOrder: "asc" } }, categories: { include: { category: true } }, collections: { include: { collection: true } }, variants: { where: { active: true }, orderBy: { name: "asc" } } }, orderBy: [{ featured: "desc" }, { publishedAt: "desc" }], take: 6 }),
    prisma.product.findMany({ where: { status: "ACTIVE", categories: { some: { category: { OR: [{ slug: "corporate-gifts-kenya" }, { slug: "corporate", kind: "OCCASION" }] } } } }, include: { images: { orderBy: { sortOrder: "asc" } }, categories: { include: { category: true } }, collections: { include: { collection: true } }, variants: { where: { active: true }, orderBy: { name: "asc" } } }, orderBy: [{ featured: "desc" }, { publishedAt: "desc" }], take: 6 }),
  ]);
  return <div>
    <Section title="Flash Sale" products={flashSale} flash />
    <Section title="On Sale" products={sale} href="/shop?deals=1" />
    <Section title="Most Bought" products={mostBought} />
    <Section title="Best Sellers" products={bestSellers} />
    <Section title="New Arrivals" products={newArrivals} href="/shop?sort=new" />
    <Section title="Personalized Gifts" products={personalized} href="/shop?personalized=true" />
    <Section title="Corporate Gifts" products={corporateCategory} />
  </div>;
}
