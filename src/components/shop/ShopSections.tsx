import Link from "next/link";
import { ProductCard } from "@/components/product/ProductCard";
import { FlashSaleCountdown } from "@/components/shop/FlashSaleCountdown";
import type { FlashSaleSettings } from "@/lib/data/products";
import { FLASH_SALE_DEFAULT_BOX_COLOR, isHexColor } from "@/lib/data/products";
import {
  getBestSellerProducts,
  getDealProducts,
  getFeaturedProducts,
  getFlashSaleProducts,
  getFlashSaleSettings,
  getMostBoughtProducts,
  type ProductWithRelations,
} from "@/lib/data/products";
import { prisma } from "@/lib/prisma";

type SectionProps = { title: string; products: ProductWithRelations[]; href?: string; flash?: boolean; swipe?: boolean; flashSale?: FlashSaleSettings };

/** Picks readable title text (ink or white) for any admin-chosen box color. */
function contrastText(hex: string): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "var(--color-ink)";
  const n = parseInt(m[1], 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.6 ? "var(--color-ink)" : "#FFFFFF";
}

function Section({ title, products, href, flash = false, swipe = false, flashSale }: SectionProps) {
  if (!products.length) return null;
  if (flash && flashSale) {
    const boxColor = isHexColor(flashSale.boxColor) ? flashSale.boxColor : FLASH_SALE_DEFAULT_BOX_COLOR;
    const textColor = contrastText(boxColor);
    return (
      <section className="mb-9 rounded-[1.75rem] border border-black/5 p-4 shadow-glass sm:mb-11 sm:p-6" style={{ backgroundColor: boxColor }}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold sm:text-2xl" style={{ color: textColor }}>
              {flashSale.title || title}
            </h2>
            {flashSale.subtitle ? (
              <p className="mt-0.5 text-sm opacity-70" style={{ color: textColor }}>{flashSale.subtitle}</p>
            ) : null}
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <FlashSaleCountdown startsAt={flashSale.startsAt} endsAt={flashSale.endsAt} active={flashSale.active} />
            {href && <Link href={href} className="shrink-0 rounded-full border border-rose-200 bg-white/70 px-3 py-1 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700">See more</Link>}
          </div>
        </div>
        <div className={swipe
          ? "flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 touch-pan-x overscroll-x-contain scrollbar-none"
          : "grid grid-cols-3 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4"}>
          {products.map((product) => (
            <div key={product.id} className={swipe ? "min-w-[44vw] snap-start sm:min-w-[240px] lg:min-w-[260px]" : ""}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </section>
    );
  }
  return (
    <section className="mb-9 sm:mb-11">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-display text-xl font-bold text-[var(--color-ink)] sm:text-2xl">{title}</h2>
        <div className="flex min-w-0 items-center gap-2">
          {flash && flashSale && <FlashSaleCountdown startsAt={flashSale.startsAt} endsAt={flashSale.endsAt} active={flashSale.active} />}
          {href && <Link href={href} className="shrink-0 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700">See more</Link>}
        </div>
      </div>
      <div className={swipe
        ? "flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 touch-pan-x overscroll-x-contain scrollbar-none"
        : "grid grid-cols-3 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4"}>
        {products.map((product) => (
          <div key={product.id} className={swipe ? "min-w-[72vw] snap-start sm:min-w-[260px] lg:min-w-[280px]" : ""}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}

export async function ShopSections() {
  const [flashSale, sale, mostBought, bestSellers, newArrivals, personalized, corporateCategory, flashSaleSettings] = await Promise.all([
    getFlashSaleProducts(6), getDealProducts(6), getMostBoughtProducts(6), getBestSellerProducts(6), getFeaturedProducts(6),
    prisma.product.findMany({ where: { status: "ACTIVE", personalizationEnabled: true }, include: { images: { orderBy: { sortOrder: "asc" } }, categories: { include: { category: true } }, collections: { include: { collection: true } }, variants: { where: { active: true }, orderBy: { name: "asc" } } }, orderBy: [{ featured: "desc" }, { publishedAt: "desc" }], take: 6 }),
    prisma.product.findMany({ where: { status: "ACTIVE", categories: { some: { category: { OR: [{ slug: "corporate-gifts-kenya" }, { slug: "corporate", kind: "OCCASION" }] } } } }, include: { images: { orderBy: { sortOrder: "asc" } }, categories: { include: { category: true } }, collections: { include: { collection: true } }, variants: { where: { active: true }, orderBy: { name: "asc" } } }, orderBy: [{ featured: "desc" }, { publishedAt: "desc" }], take: 6 }),
    getFlashSaleSettings(),
  ]);
  return <div>
    <Section title="Flash Sale" products={flashSale} flash href="/shop?flashSale=1" swipe flashSale={flashSaleSettings} />
    <Section title="On Sale" products={sale} href="/shop?deals=1" />
    <Section title="Most Bought" products={mostBought} href="/shop?sort=popular" />
    <Section title="Best Sellers" products={bestSellers} href="/shop?bestSeller=1" />
    <Section title="New Arrivals" products={newArrivals} href="/shop?sort=new" />
    <Section title="Personalized Gifts" products={personalized} href="/shop?personalized=true" />
    <Section title="Corporate Gifts" products={corporateCategory} href="/shop?category=corporate-gifts-kenya" />
  </div>;
}
