"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { CATEGORY_STRIP, NAV_GROUPS, type NavColumn } from "@/lib/constants";

const GROUP_BY_HREF: Record<string, string> = {
  "/product-category/men-gifts": "Men",
  "/product-category/ladies-gifts": "Women",
  "/product-category/corporate-gifts-kenya": "Corporate Gifts",
  "/product-category/promotional-gifts": "Promotional",
  "/product-category/personalized-gifts": "Personalized",
  "/product-category/men-watches-on-sale": "Watches",
};

const CARDS_COLUMNS: NavColumn[] = [
  {
    title: "Cards & keepsakes",
    children: [
      { label: "Plantable Seed Cards", href: "/product/plantable-seed-card-set" },
      { label: "Keepsake Cards", href: "/product/graduation-memory-keepsake" },
      { label: "Leather Card Holder", href: "/product/leather-card-holder" },
    ],
  },
];

function columnsFor(href: string): NavColumn[] {
  if (href === "/cards") return CARDS_COLUMNS;
  if (href === "/product-category/award-trophies-in-nairobi") {
    const corporate = NAV_GROUPS.find((g) => g.label === "Corporate Gifts");
    return corporate ? corporate.columns.filter((c) => c.title === "Awards & Trophies Gifts") : [];
  }
  const groupName = GROUP_BY_HREF[href];
  const group = groupName ? NAV_GROUPS.find((g) => g.label === groupName) : undefined;
  return group ? group.columns : [];
}

/** Sidebar "Product Categories" card, styled like the Rio Gift Shop widget. */
export function ProductCategoriesCard() {
  const [openHref, setOpenHref] = useState<string | null>(null);

  return (
    <aside className="w-full rounded-2xl bg-[#C24B80] p-5 text-white shadow-sm" aria-label="Product categories">
      <h2 className="font-display text-xl font-bold leading-none">Product Categories</h2>
      <ul className="mt-2">
        {CATEGORY_STRIP.map((c) => {
          const columns = columnsFor(c.href);
          const open = openHref === c.href;
          const menuId = `sidebar-cat-${c.href.replace(/[^a-z0-9]+/gi, "-")}`;

          return (
            <li key={c.href} className="border-b border-dashed border-white/50 last:border-b-0">
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={c.href}
                  className="block flex-1 py-3.5 font-display text-base font-semibold text-white transition-colors hover:text-white/80"
                >
                  {c.label}
                </Link>
                {columns.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setOpenHref(open ? null : c.href)}
                    aria-expanded={open}
                    aria-controls={menuId}
                    aria-label={open ? `Hide ${c.label} options` : `Show ${c.label} options`}
                    className="grid size-8 shrink-0 place-items-center rounded-full text-white/90 transition-colors hover:bg-white/15"
                  >
                    <ChevronDown className={`size-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
                  </button>
                )}
              </div>
              {open && (
                <div id={menuId} className="pb-3">
                  {columns.map((col) => (
                    <div key={col.title} className="mt-2">
                      <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-white/60">{col.title}</p>
                      <ul className="mt-0.5">
                        {col.children.map((sub) => (
                          <li key={`${col.title}-${sub.href}`}>
                            <Link
                              href={sub.href}
                              className="block py-1.5 pl-3 text-sm text-white/90 transition-colors hover:text-white"
                            >
                              {sub.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
