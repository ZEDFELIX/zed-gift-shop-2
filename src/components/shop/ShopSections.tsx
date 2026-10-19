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

export type ShopSection = {
  title: string;
  products: ProductWithRelations[];
  href?: string;
  flash?: boolean;
  flashSale?: FlashSaleSettings;
  titleColor?: string;
};

/** Picks readable title text (ink or white) for any admin-chosen box color. */
function contrastText(hex: string): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "var(--color-ink)";
  const n = parseInt(m[1], 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.6 ? "var(--color-ink)" : "#FFFFFF";
}

function Section({ title, products, href, flash = false, flashSale, titleColor }: ShopSection) {
  if (!products.length) return null;
  if (flash && flashSale) {
    const boxColor = isHexColor(flashSale.boxColor) ? flashSale.boxColor : FLASH_SALE_DEFAULT_BOX_COLOR;
    const textColor = contrastText(boxColor);
    return (
      <section
        className="relative mb-9 overflow-hidden rounded-2xl border border-black/5 p-3 shadow-lg sm:mb-11 sm:p-5"
        style={{ backgroundColor: boxColor }}
      >
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
          <div className="flex min-w-0 flex-wrap items-center gap-3" style={{ color: textColor }}>
            <FlashSaleCountdown startsAt={flashSale.startsAt} endsAt={flashSale.endsAt} active={flashSale.active} />
            {href && <Link href={href} className="shrink-0 rounded-md bg-white px-3 py-1.5 text-xs font-bold text-orange-600 shadow-sm transition-colors hover:bg-orange-50">See all</Link>}
          </div>
        </div>
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider opacity-65" style={{ color: textColor }}>
          Swipe to explore <ArrowRight className="size-3.5" />
        </div>
        <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain rounded-lg pb-2 touch-auto scrollbar-none">
          {products.map((product) => (
            <div key={product.id} className="w-[45vw] min-w-[45vw] shrink-0 snap-start sm:w-[240px] sm:min-w-[240px] lg:w-[260px] lg:min-w-[260px]">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </section>
    );
  }
  return (
    <section className="glass-panel mb-7 overflow-hidden rounded-2xl p-3 sm:mb-9 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2 border-b-2 border-orange-400 pb-2.5">
        <h2 className={`font-display text-lg font-bold sm:text-xl ${titleColor ?? "text-[var(--color-ink)]"}`}>{title}</h2>
        {href && <Link href={href} className="shrink-0 rounded-md bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-600 transition-colors hover:bg-orange-100">See all <span aria-hidden="true">›</span></Link>}
      </div>
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-charcoal/50">
        Swipe to explore <ArrowRight className="size-3.5" />
      </div>
      <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain pb-2 touch-auto scrollbar-none">
        {products.map((product) => (
          <div key={product.id} className="w-[45vw] min-w-[45vw] shrink-0 snap-start sm:w-[240px] sm:min-w-[240px] lg:w-[260px] lg:min-w-[260px]">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function ShopSections({ sections }: { sections: ShopSection[] }) {
  return (
    <div>
      {sections.map((s) => (
        <Section key={s.title} {...s} />
      ))}
    </div>
  );
}

/**
 * Builds the homepage highlight sections, de-duplicating so a product appears
 * in the earliest section only. `shownIds` lets the caller hide them in the grid.
 */
export async function getShopSectionData(): Promise<{ sections: ShopSection[]; shownIds: string[] }> {
  const [flashSale, sale, mostBought, bestSellers, newArrivals, personalized, corporateCategory, flashSaleSettings] = await Promise.all([
    getFlashSaleProducts(6), getDealProducts(6), getMostBoughtProducts(6), getBestSellerProducts(6), getFeaturedProducts(6),
    prisma.product.findMany({ where: { status: "ACTIVE", personalizationEnabled: true }, include: { images: { orderBy: { sortOrder: "asc" } }, categories: { include: { category: true } }, collections: { include: { collection: true } }, variants: { where: { active: true }, orderBy: { name: "asc" } } }, orderBy: [{ featured: "desc" }, { publishedAt: "desc" }], take: 6 }),
    prisma.product.findMany({ where: { status: "ACTIVE", categories: { some: { category: { OR: [{ slug: "corporate-gifts-kenya" }, { slug: "corporate", kind: "OCCASION" }] } } } }, include: { images: { orderBy: { sortOrder: "asc" } }, categories: { include: { category: true } }, collections: { include: { collection: true } }, variants: { where: { active: true }, orderBy: { name: "asc" } } }, orderBy: [{ featured: "desc" }, { publishedAt: "desc" }], take: 6 }),
    getFlashSaleSettings(),
  ]);

  const seen = new Set<string>();
  const take = (list: ProductWithRelations[]) =>
    list.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));

  const sections: ShopSection[] = [
    { title: "Flash Sale", products: take(flashSale), flash: true, href: "/shop?flashSale=1", flashSale: flashSaleSettings },
    { title: "On Sale", products: take(sale), href: "/shop?deals=1" },
    { title: "Most Bought", products: take(mostBought), href: "/shop?sort=popular" },
    { title: "Best Sellers", products: take(bestSellers), href: "/shop?bestSeller=1" },
    { title: "New Arrivals", products: take(newArrivals), href: "/shop?sort=new", titleColor: "text-rose-600" },
    { title: "Personalized Gifts", products: take(personalized), href: "/shop?personalized=true" },
    { title: "Corporate Gifts", products: take(corporateCategory), href: "/shop?category=corporate-gifts-kenya" },
  ].filter((s) => s.products.length > 0);

  return { sections, shownIds: [...seen] };
}
