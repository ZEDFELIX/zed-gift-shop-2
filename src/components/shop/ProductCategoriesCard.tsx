"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  ChevronDown,
  Gift,
  Heart,
  Sparkles,
  Trophy,
  Watch,
  Users,
  type LucideIcon,
} from "lucide-react";
import { CATEGORY_STRIP, NAV_GROUPS, type NavColumn } from "@/lib/constants";

const GROUP_BY_HREF: Record<string, string> = {
  "/product-category/men-gifts": "Men",
  "/product-category/ladies-gifts": "Women",
  "/product-category/corporate-gifts-kenya": "Corporate Gifts",
  "/product-category/promotional-gifts": "Promotional",
  "/product-category/personalized-gifts": "Personalized",
  "/product-category/men-watches-on-sale": "Watches",
};

const CATEGORY_ICONS: LucideIcon[] = [
  Users,
  Heart,
  Gift,
  Trophy,
  BriefcaseBusiness,
  Sparkles,
  Gift,
  Watch,
];

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

/** Shop sidebar category shortcuts with expandable subcategories. */
export function ProductCategoriesCard() {
  const [openHref, setOpenHref] = useState<string | null>(null);

  return (
    <aside
      className="w-full rounded-2xl border border-[#6C2D5C]/15 bg-[#F3F0EA] p-4 shadow-[0_8px_28px_rgba(23,23,23,0.06)] sm:p-5"
      aria-label="Shop by category"
    >
      <div className="mb-4 border-b border-[#6C2D5C]/15 pb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6C2D5C]/70">
          Find the perfect gift
        </p>
        <h2 className="mt-1 font-display text-xl font-bold leading-tight text-[#171717]">
          Shop by category
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-[#171717]/65">
          Explore gifts picked for every style and occasion.
        </p>
      </div>

      <ul className="space-y-2">
        {CATEGORY_STRIP.map((category, index) => {
          const columns = columnsFor(category.href);
          const open = openHref === category.href;
          const menuId = `sidebar-cat-${category.href.replace(/[^a-z0-9]+/gi, "-")}`;
          const Icon = CATEGORY_ICONS[index] ?? Gift;

          return (
            <li key={category.href}>
              <div
                className={`group flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-all duration-200 ${
                  open
                    ? "border-[#6C2D5C] bg-[#6C2D5C] shadow-md"
                    : "border-[#6C2D5C]/15 bg-white hover:-translate-y-0.5 hover:border-[#6C2D5C]/45 hover:shadow-md"
                }`}
              >
                <Link href={category.href} className="flex min-w-0 flex-1 items-center gap-3">
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-lg transition-colors ${
                      open ? "bg-[#F3F0EA]/15 text-[#F3F0EA]" : "bg-[#6C2D5C]/8 text-[#6C2D5C] group-hover:bg-[#6C2D5C] group-hover:text-[#F3F0EA]"
                    }`}
                  >
                    <Icon className="size-[18px]" strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm font-semibold ${open ? "text-[#F3F0EA]" : "text-[#171717]"}`}>
                      {category.label}
                    </span>
                    <span className={`mt-0.5 block text-[10px] ${open ? "text-[#F3F0EA]/70" : "text-[#171717]/55"}`}>
                      Explore collection
                    </span>
                  </span>
                  <ArrowUpRight className={`size-4 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${open ? "text-[#F3F0EA]" : "text-[#6C2D5C]"}`} />
                </Link>

                {columns.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setOpenHref(open ? null : category.href)}
                    aria-expanded={open}
                    aria-controls={menuId}
                    aria-label={open ? `Hide ${category.label} options` : `Show ${category.label} options`}
                    className={`grid size-8 shrink-0 place-items-center rounded-lg transition-colors ${
                      open
                        ? "bg-[#F3F0EA]/15 text-[#F3F0EA] hover:bg-[#F3F0EA]/25"
                        : "bg-[#6C2D5C]/8 text-[#6C2D5C] hover:bg-[#6C2D5C]/15"
                    }`}
                  >
                    <ChevronDown className={`size-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
                  </button>
                )}
              </div>

              {open && (
                <div id={menuId} className="mx-2 mt-1 rounded-b-xl border border-t-0 border-[#6C2D5C]/15 bg-white px-3 pb-3 pt-2">
                  {columns.map((column) => (
                    <div key={column.title} className="mt-2 first:mt-0">
                      <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-[#6C2D5C]/70">
                        {column.title}
                      </p>
                      <ul className="mt-1 grid grid-cols-1 gap-0.5">
                        {column.children.map((sub) => (
                          <li key={`${column.title}-${sub.href}`}>
                            <Link
                              href={sub.href}
                              className="block rounded-lg px-2 py-2 text-xs text-[#171717]/80 transition-colors hover:bg-[#F3F0EA] hover:text-[#6C2D5C]"
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
