import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
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

type SectionProps = { title: string; products: ProductWithRelations[]; href?: string; flash?: boolean; swipe?: boolean; flashSale?: FlashSaleSettings; titleColor?: string };

/** Picks readable title text (ink or white) for any admin-chosen box color. */
function contrastText(hex: string): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "var(--color-ink)";
  const n = parseInt(m[1], 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.6 ? "var(--color-ink)" : "#FFFFFF";
}

function Section({ title, products, href, flash = false, swipe = false, flashSale, titleColor }: SectionProps) {
  if (!products.length) return null;
  if (flash && flashSale) {
    const boxColor = isHexColor(flashSale.boxColor) ? flashSale.boxColor : FLASH_SALE_DEFAULT_BOX_COLOR;
    const textColor = contrastText(boxColor);
    return (
      <section className="mb-9 rounded-xl border border-black/5 p-3 shadow-sm sm:mb-11 sm:p-5" style={{ backgroundColor: boxColor }}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-rose-500 text-white sm:size-10">
              <Zap className="size-5 fill-current" />
            </span>
            <div className="min-w-0">
              <h2 className="font-ui text-xl font-extrabold uppercase leading-none tracking-tight sm:text-2xl" style={{ color: textColor }}>
                {flashSale.title || title}
              </h2>
              {flashSale.subtitle ? (
                <p className="mt-1 text-sm opacity-70" style={{ color: textColor }}>{flashSale.subtitle}</p>
              ) : null}
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <FlashSaleCountdown startsAt={flashSale.startsAt} endsAt={flashSale.endsAt} active={flashSale.active} />
            {href && <Link href={href} className="shrink-0 rounded-md bg-white px-3 py-1.5 text-xs font-bold text-orange-600 shadow-sm transition-colors hover:bg-orange-50">See all</Link>}
          </div>
        </div>
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider opacity-65" style={{ color: textColor }}>
          Swipe to explore <ArrowRight className="size-3.5" />
        </div>
        <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain rounded-lg pb-2 touch-auto scrollbar-none">
          {products.map((product) => (
            <div key={product.id} className="w-[44vw] min-w-[44vw] shrink-0 snap-start sm:w-[210px] sm:min-w-[210px] lg:w-[225px] lg:min-w-[225px]">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </section>
    );
  }
  return (
    <section className={swipe ? "mb-7 overflow-hidden rounded-xl border border-black/5 bg-white p-3 shadow-sm sm:mb-9 sm:p-4" : "mb-9 sm:mb-11"}>
      <div className={swipe ? "mb-3 flex items-center justify-between gap-2 border-b-2 border-orange-400 pb-2.5" : "mb-3 flex items-center justify-between gap-2"}>
        <h2 className={`font-display text-lg font-bold sm:text-xl ${titleColor ?? "text-[var(--color-ink)]"}`}>{title}</h2>
        <div className="flex min-w-0 items-center gap-2">
          {flash && flashSale && <FlashSaleCountdown startsAt={flashSale.startsAt} endsAt={flashSale.endsAt} active={flashSale.active} />}
          {href && <Link href={href} className="shrink-0 rounded-md bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-600 transition-colors hover:bg-orange-100">See all <span aria-hidden="true">›</span></Link>}
        </div>
      </div>
      {swipe && (
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold text-charcoal/50">
          Swipe to explore <ArrowRight className="size-3.5" />
        </div>
      )}
      <div className={swipe
        ? "flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain pb-2 touch-auto scrollbar-none"
        : "grid grid-cols-3 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4"}>
        {products.map((product) => (
          <div key={product.id} className={swipe ? "w-[44vw] min-w-[44vw] shrink-0 snap-start sm:w-[210px] sm:min-w-[210px] lg:w-[225px] lg:min-w-[225px]" : ""}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}

export async function FlashSaleSection() {
  const [flashSale, flashSaleSettings] = await Promise.all([
    getFlashSaleProducts(6),
    getFlashSaleSettings(),
  ]);
  return (
    <Section
      title="Flash Sale"
      products={flashSale}
      flash
      href="/shop?flashSale=1"
      swipe
      flashSale={flashSaleSettings}
    />
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
    <Section title="On Sale" products={sale} href="/shop?deals=1" swipe />
    <Section title="Most Bought" products={mostBought} href="/shop?sort=popular" swipe />
    <Section title="Best Sellers" products={bestSellers} href="/shop?bestSeller=1" swipe />
    <Section title="New Arrivals" products={newArrivals} href="/shop?sort=new" titleColor="text-rose-600" swipe />
    <Section title="Personalized Gifts" products={personalized} href="/shop?personalized=true" swipe />
    <Section title="Corporate Gifts" products={corporateCategory} href="/shop?category=corporate-gifts-kenya" swipe />
  </div>;
}
