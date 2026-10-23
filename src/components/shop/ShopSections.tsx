import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { FlashSaleCountdown } from "@/components/shop/FlashSaleCountdown";
import type { FlashSaleSettings } from "@/lib/data/products";
import { FLASH_SALE_DEFAULT_BOX_COLOR, isHexColor } from "@/lib/data/products";
import {
  getFlashSaleProducts,
  getFlashSaleSettings,
  type ProductWithRelations,
} from "@/lib/data/products";

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
        className="relative mb-5 overflow-hidden rounded-xl border border-black/5 p-2 sm:mb-6 sm:p-2"
        style={{ backgroundColor: boxColor }}
      >
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-black/10 pb-1.5">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-rose-500 text-white sm:size-7">
              <Zap className="size-3.5 fill-current" />
            </span>
            <div className="min-w-0">
              <h2 className="font-ui text-sm font-extrabold uppercase leading-none tracking-tight sm:text-lg" style={{ color: textColor }}>
                {flashSale.title || title}
              </h2>
              {flashSale.subtitle ? (
                <p className="mt-0.5 text-[10px] opacity-70" style={{ color: textColor }}>{flashSale.subtitle}</p>
              ) : null}
            </div>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2" style={{ color: textColor }}>
            <FlashSaleCountdown startsAt={flashSale.startsAt} endsAt={flashSale.endsAt} active={flashSale.active} />
            {href && (
              <Link
                href={href}
                className="shrink-0 rounded-md border border-edge bg-white px-3 py-1.5 text-[11px] font-bold text-[#07111F] shadow-sm transition-colors hover:bg-zed-950 hover:text-white"
              >
                See all
              </Link>
            )}
          </div>
        </div>
        <div className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider opacity-65" style={{ color: textColor }}>
          Swipe to explore <ArrowRight className="size-3" />
        </div>
          <div className="flex snap-x snap-mandatory gap-1.5 overflow-x-auto overscroll-x-contain rounded-lg pb-1 touch-auto scrollbar-none">
            {products.map((product) => (
              <div key={product.id} className="w-[140px] min-w-[140px] shrink-0 snap-start sm:w-[160px] sm:min-w-[160px] lg:w-[180px] lg:min-w-[180px]">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
      </section>
    );
  }
  return (
    <section className="glass-panel mb-5 overflow-hidden rounded-xl p-2 sm:mb-6 sm:p-3">
      <div className="mb-2 flex items-center justify-between gap-2 border-b-2 border-orange-400 pb-1.5">
        <h2 className={`font-display text-sm font-bold sm:text-xl ${titleColor ?? "text-[var(--color-ink)]"}`}>{title}</h2>
        {href && (
          <Link
            href={href}
            className="shrink-0 rounded-md border border-edge bg-white px-3 py-1.5 text-[11px] font-bold text-[#07111F] shadow-sm transition-colors hover:bg-zed-950 hover:text-white"
          >
            See all
          </Link>
        )}
      </div>
      <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-charcoal/50 sm:text-[11px]">
        Swipe to explore <ArrowRight className="size-3 sm:size-3.5" />
      </div>
      <div className="flex snap-x snap-mandatory gap-1.5 overflow-x-auto overscroll-x-contain pb-1 touch-auto scrollbar-none">
        {products.map((product) => (
          <div key={product.id} className="w-[45vw] min-w-[45vw] shrink-0 snap-start sm:w-[220px] sm:min-w-[220px] lg:w-[240px] lg:min-w-[240px]">
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
 * Builds the shop-page highlight section(s). Only the flash sale carousel is
 * shown; `shownIds` lets the caller hide its products in the grid.
 */
export async function getShopSectionData(): Promise<{ sections: ShopSection[]; shownIds: string[] }> {
  const [flashSale, flashSaleSettings] = await Promise.all([
    getFlashSaleProducts(6),
    getFlashSaleSettings(),
  ]);

  const sections: ShopSection[] = flashSale.length
    ? [{ title: "Flash Sale", products: flashSale, flash: true, href: "/shop?flashSale=1", flashSale: flashSaleSettings }]
    : [];

  return { sections, shownIds: flashSale.map((p) => p.id) };
}
