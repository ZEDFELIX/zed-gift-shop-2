import Link from "next/link";
import { ProductCard } from "@/components/product/ProductCard";
import {
  getBestSellerProducts,
  getDealProducts,
  getFeaturedProducts,
  getFlashSaleProducts,
  getMostBoughtProducts,
  type ProductWithRelations,
} from "@/lib/data/products";
import { prisma } from "@/lib/prisma";

type SectionProps = {
  title: string;
  subtitle?: string;
  products: ProductWithRelations[];
  href?: string;
};

function Section({ title, subtitle, products, href }: SectionProps) {
  if (!products.length) return null;

  return (
    <section className="mb-9 sm:mb-11">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-[var(--color-ink)] sm:text-2xl">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-[rgba(48,37,34,0.62)]">{subtitle}</p>
          ) : null}
        </div>
        {href ? (
          <Link
            href={href}
            className="shrink-0 text-xs font-semibold text-rose-600 hover:text-rose-700"
          >
            View all →
          </Link>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
        {products.slice(0, 4).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

export async function ShopSections() {
  const [
    flashSale,
    sale,
    mostBought,
    bestSellers,
    newArrivals,
    personalized,
    corporateCategory,
  ] = await Promise.all([
    getFlashSaleProducts(6),
    getDealProducts(6),
    getMostBoughtProducts(6),
    getBestSellerProducts(6),
    getFeaturedProducts(6),
    prisma.product.findMany({
      where: { status: "ACTIVE", personalizationEnabled: true },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        categories: { include: { category: true } },
        collections: { include: { collection: true } },
        variants: { where: { active: true }, orderBy: { name: "asc" } },
      },
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      take: 6,
    }),
    prisma.product.findMany({
      where: {
        status: "ACTIVE",
        categories: {
          some: {
            category: {
              OR: [
                { slug: "corporate-gifts-kenya" },
                { slug: "corporate", kind: "OCCASION" },
              ],
            },
          },
        },
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        categories: { include: { category: true } },
        collections: { include: { collection: true } },
        variants: { where: { active: true }, orderBy: { name: "asc" } },
      },
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      take: 6,
    }),
  ]);

  const effectiveFlashSale = flashSale;

  return (
    <div>
      <Section
        title="Flash Sale"
        subtitle="Limited-time offers — grab them before they’re gone."
        products={effectiveFlashSale}
      />
      <Section
        title="On Sale"
        subtitle="Special prices across selected ZED gifts."
        products={sale}
        href="/shop?deals=1"
      />
      <Section
        title="Most Bought"
        subtitle="What customers are actually buying most."
        products={mostBought}
      />
      <Section
        title="Best Sellers"
        subtitle="Popular picks from the ZED collection."
        products={bestSellers}
      />
      <Section
        title="New Arrivals"
        subtitle="Fresh gifts added to the collection."
        products={newArrivals}
        href="/shop?sort=new"
      />
      <Section
        title="Personalized Gifts"
        subtitle="Add a name, message or special touch."
        products={personalized}
        href="/shop?personalized=true"
      />
      <Section
        title="Corporate Gifts"
        subtitle="Gifts for teams, clients and staff."
        products={corporateCategory}
      />
    </div>
  );
}
