import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { FlashSaleCountdown } from "@/components/shop/FlashSaleCountdown";
import type { FlashSaleSettings } from "@/lib/data/products";
import { getSetting } from "@/lib/data/settings";
import { FLASH_SALE_DEFAULT_BOX_COLOR, isHexColor } from "@/lib/data/products";
import {
  getFlashSaleProducts,
  getFlashSaleSettings,
  getGiftSetProducts,
  getNewArrivalProducts,
  getPopularShopProducts,
  type ProductCardData,
} from "@/lib/data/products";

export type ShopSection = {
  title: string;
  products: ProductCardData[];
  href?: string;
  flash?: boolean;
  flashSale?: FlashSaleSettings;
  titleColor?: string;
  backgroundColor?: string;
  giftSet?: boolean;
};

/** Picks readable title text (ink or white) for any admin-chosen box color. */
function contrastText(hex: string): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "var(--color-ink)";
  const n = parseInt(m[1], 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.6 ? "var(--color-ink)" : "#FFFFFF";
}

function Section({ title, products, href, flash = false, flashSale, titleColor, backgroundColor, giftSet = false }: ShopSection) {
  if (!products.length) return null;
  if (flash && flashSale) {
    const boxColor = isHexColor(flashSale.boxColor) ? flashSale.boxColor : FLASH_SALE_DEFAULT_BOX_COLOR;
    const textColor = contrastText(boxColor);
    return (
      <section
        className="relative mb-4 overflow-hidden rounded-2xl border p-2.5 shadow-sm sm:mb-5 sm:p-3"
        style={{ backgroundColor: boxColor, color: textColor, borderColor: textColor === "#FFFFFF" ? "rgba(255,255,255,.22)" : "rgba(0,0,0,.10)" }}
        aria-label={flashSale.title || title}
      >
        <div className="mb-2 flex min-w-0 items-center justify-between gap-2 border-b pb-2" style={{ borderColor: textColor === "#FFFFFF" ? "rgba(255,255,255,.22)" : "rgba(0,0,0,.10)" }}>
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#171717] text-white shadow-sm">
              <Zap className="size-4 fill-current" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="font-ui text-sm font-extrabold leading-tight tracking-tight sm:text-base" style={{ color: textColor }}>
                {flashSale.title || title}
              </h2>
              {flashSale.subtitle ? (
                <p className="mt-0.5 line-clamp-1 text-[10px] opacity-75 sm:text-xs" style={{ color: textColor }}>{flashSale.subtitle}</p>
              ) : (
                <p className="mt-0.5 text-[10px] opacity-75 sm:text-xs" style={{ color: textColor }}>Limited-time offers</p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2" style={{ color: textColor }}>
            <FlashSaleCountdown startsAt={flashSale.startsAt} endsAt={flashSale.endsAt} active={flashSale.active} textColor={textColor} />
            {href && (
              <Link
                href={href}
                className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-full border px-2.5 py-1.5 text-[10px] font-bold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:px-3 sm:text-xs" style={{ color: textColor, borderColor: textColor === "#FFFFFF" ? "rgba(255,255,255,.45)" : "rgba(0,0,0,.16)", backgroundColor: textColor === "#FFFFFF" ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.9)" }}
              >
                See all <ArrowRight className="size-3" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
        <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain rounded-xl pb-1 touch-auto scrollbar-none">
          {products.map((product, index) => (
            <div key={product.id} className="w-[148px] min-w-[148px] shrink-0 snap-start sm:w-[170px] sm:min-w-[170px] lg:w-[190px] lg:min-w-[190px]">
              <ProductCard product={product} priority={index < 2} />
            </div>
          ))}
        </div>
      </section>
    );
  }
  return (
    <section className={`mb-4 overflow-hidden rounded-2xl border p-2 shadow-sm sm:mb-5 sm:p-3 ${giftSet ? "border-[#d9bfd2] ring-1 ring-[#ead9e7]" : "border-[#e8e2dc]"}`} style={{ backgroundColor: backgroundColor || "#FFFFFF" }}>
      <div className="mb-2 flex items-center justify-between gap-2 border-b border-[#e8e2dc] pb-2">
        <h2 className="font-display text-sm font-bold sm:text-xl" style={{ color: titleColor || "var(--color-ink)" }}>{giftSet ? <span className="inline-flex items-center gap-2"><span className="grid size-7 place-items-center rounded-lg bg-[#6B2D5C] text-xs text-white">G</span>{title}</span> : title}</h2>
        {href && (
          <Link
            href={href}
            className="shrink-0 rounded-md border border-edge bg-white px-3 py-1.5 text-[11px] font-semibold text-[#171717] transition-colors hover:bg-[#171717] hover:text-white"
          >
            See all
          </Link>
        )}
      </div>
      <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-[#77716f] sm:text-[11px]">
        Swipe to explore <ArrowRight className="size-3 sm:size-3.5" />
      </div>
      <div className="flex snap-x snap-mandatory gap-1.5 overflow-x-auto overscroll-x-contain pb-1 touch-auto scrollbar-none">
        {products.map((product, index) => (
          <div key={product.id} className="w-[148px] min-w-[148px] shrink-0 snap-start sm:w-[170px] sm:min-w-[170px] lg:w-[190px] lg:min-w-[190px]">
            <ProductCard product={product} priority={index < 2} />
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
 * Build a richer storefront from live catalogue data. Each product appears in
 * only one curated rail and is removed from the main grid to avoid repetition.
 */
export async function getShopSectionData(): Promise<{ sections: ShopSection[]; shownIds: string[] }> {
  const [flashSale, flashSaleSettings, giftSets, arrivals, popular, savedCarousels] = await Promise.all([
    getFlashSaleProducts(8),
    getFlashSaleSettings(),
    getGiftSetProducts(8),
    getNewArrivalProducts(8),
    getPopularShopProducts(8),
    getSetting("carouselSections"),
  ]);

  const used = new Set<string>();
  const unique = (items: ProductCardData[]) => items.filter((item) => {
    if (used.has(item.id)) return false;
    used.add(item.id);
    return true;
  });

  const sections: ShopSection[] = [];
  const now = Date.now();
  const startsAt = flashSaleSettings.startsAt ? new Date(flashSaleSettings.startsAt).getTime() : null;
  const endsAt = flashSaleSettings.endsAt ? new Date(flashSaleSettings.endsAt).getTime() : null;
  const saleWindowValid = (startsAt === null || Number.isFinite(startsAt)) && (endsAt === null || Number.isFinite(endsAt));
  const saleVisible = flashSaleSettings.active && saleWindowValid && (startsAt === null || now >= startsAt) && (endsAt === null || now < endsAt);
  const flashItems = saleVisible ? unique(flashSale) : [];
  if (flashItems.length) {
    sections.push({
      title: "Limited-time offers",
      products: flashItems,
      flash: true,
      href: "/shop?flashSale=1",
      flashSale: flashSaleSettings,
    });
  }

  const giftSetItems = unique(giftSets);
  if (giftSetItems.length) {
    sections.push({
      title: "Gift Sets",
      products: giftSetItems,
      href: "/shop?q=gift%20set",
      titleColor: "#6B2D5C",
      backgroundColor: "#F7EDF4",
      giftSet: true,
    });
  }

  const newItems = unique(arrivals);
  if (newItems.length) {
    sections.push({
      title: "New arrivals",
      products: newItems,
      href: "/shop?sort=new",
      titleColor: "#6B2D5C",
    });
  }

  const popularItems = unique(popular);
  if (popularItems.length) {
    sections.push({
      title: "Popular gifts",
      products: popularItems,
      href: "/shop?sort=popular",
      titleColor: "#6B2D5C",
    });
  }

  const configured = Array.isArray(savedCarousels) ? savedCarousels as Array<{id?:string;title?:string;query?:string;href?:string;backgroundColor?:string;titleColor?:string;enabled?:boolean}> : [];
  if (configured.length) {
    const defaultsById = new Map(sections.map((section) => [
      section.title === "Gift Sets" ? "gift-sets" : section.title === "New arrivals" ? "new-arrivals" : section.title === "Popular gifts" ? "popular-gifts" : "limited-offers",
      section,
    ]));
    const configuredSections: ShopSection[] = [];
    for (const item of configured) {
      if (item.enabled === false || !item.title?.trim()) continue;
      const existing = defaultsById.get(item.id || "");
      if (existing) {
        configuredSections.push({ ...existing, title: item.title, href: item.href || existing.href, backgroundColor: item.backgroundColor || "#FFFFFF", titleColor: item.titleColor || "#171717", flashSale: existing.flashSale ? { ...existing.flashSale, boxColor: item.backgroundColor || existing.flashSale.boxColor } : undefined });
        continue;
      }
      if (!item.query?.trim()) continue;
      const result = await import("@/lib/data/products").then(({ listProducts }) => listProducts({ q: item.query!.trim(), page: 1, pageSize: 8 }));
      const products = result.items.filter((product) => !used.has(product.id));
      products.forEach((product) => used.add(product.id));
      if (products.length) configuredSections.push({ title: item.title, products, href: item.href || "/shop", backgroundColor: item.backgroundColor || "#FFFFFF", titleColor: item.titleColor || "#171717" });
    }
    if (configuredSections.length) return { sections: configuredSections, shownIds: [...used] };
  }
  return { sections, shownIds: [...used] };
}
