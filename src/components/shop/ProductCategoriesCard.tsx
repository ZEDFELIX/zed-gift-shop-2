"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { CATEGORY_STRIP, NAV_GROUPS } from "@/lib/constants";

const PERSONALIZED_HREF = "/product-category/personalized-gifts";
const personalizedGroup = NAV_GROUPS.find((g) => g.label === "Personalized");

/** Sidebar "Product Categories" card, styled like the Rio Gift Shop widget. */
export function ProductCategoriesCard() {
  const [open, setOpen] = useState(false);

  return (
    <aside className="w-full rounded-2xl bg-[#C24B80] p-5 text-white shadow-sm" aria-label="Product categories">
      <h2 className="font-display text-xl font-bold leading-none">Product Categories</h2>
      <ul className="mt-2">
        {CATEGORY_STRIP.map((c) => {
          if (c.href === PERSONALIZED_HREF && personalizedGroup) {
            return (
              <li key={c.href} className="border-b border-dashed border-white/50 last:border-b-0">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={c.href}
                    className="block flex-1 py-3.5 font-display text-base font-semibold text-white transition-colors hover:text-white/80"
                  >
                    {c.label}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    aria-expanded={open}
                    aria-controls="sidebar-personalized-menu"
                    aria-label={open ? "Hide personalized gift options" : "Show personalized gift options"}
                    className="grid size-8 shrink-0 place-items-center rounded-full text-white/90 transition-colors hover:bg-white/15"
                  >
                    <ChevronDown className={`size-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
                  </button>
                </div>
                {open && (
                  <div id="sidebar-personalized-menu" className="pb-3">
                    {personalizedGroup.columns.map((col) => (
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
          }
          return (
            <li key={c.href} className="border-b border-dashed border-white/50 last:border-b-0">
              <Link
                href={c.href}
                className="block py-3.5 font-display text-base font-semibold text-white transition-colors hover:text-white/80"
              >
                {c.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
