import Link from "next/link";
import { CATEGORY_STRIP } from "@/lib/constants";

/** Classic left-hand shop category panel for desktop. */
export function ProductCategoriesCard() {
  return (
    <aside
      className="w-full rounded-2xl border border-[#6C2D5C]/15 bg-[#D9A0AC] p-5 text-[#171717] shadow-sm"
      aria-label="Product categories"
    >
      <h2 className="font-display text-xl font-bold leading-none">
        Product Categories
      </h2>
      <ul className="mt-2">
        {CATEGORY_STRIP.map((category) => (
          <li
            key={category.href}
            className="border-b border-dashed border-[#6C2D5C]/35 last:border-b-0"
          >
            <Link
              href={category.href}
              className="block py-3.5 font-display text-base font-semibold text-[#171717] transition-colors hover:text-[#6C2D5C]"
            >
              {category.label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
