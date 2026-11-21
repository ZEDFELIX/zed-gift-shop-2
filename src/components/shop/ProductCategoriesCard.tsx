import Link from "next/link";
import { listCategories } from "@/lib/data/catalog";

/** Live category panel for desktop, sourced from the same catalogue as the shop grid. */
export async function ProductCategoriesCard() {
  const allCategories = await listCategories();
  const categories = allCategories.filter((category) => category.kind === "CATEGORY" && category.parentId === null && category._count.products > 0);
  if (!categories.length) return null;

  return (
    <aside
      className="w-full rounded-2xl border border-[var(--zed-brand-secondary)]/15 bg-[color-mix(in_srgb,var(--zed-brand-primary)_7%,white)] p-4 text-[var(--zed-text-body)] shadow-sm"
      aria-label="Product categories"
    >
      <h2 className="font-display text-base font-bold leading-tight text-[var(--zed-text-heading)]">
        Shop by category
      </h2>
      <ul className="mt-2">
        {categories.map((category) => (
          <li key={category.id} className="border-b border-[var(--zed-brand-secondary)]/15 last:border-b-0">
            <Link
              href={`/shop?category=${encodeURIComponent(category.slug)}`}
              className="flex items-center justify-between gap-2 rounded-lg py-3 text-sm font-semibold text-[var(--zed-text-body)] transition-colors hover:px-2 hover:text-[var(--zed-brand-primary)]"
            >
              <span className="min-w-0 truncate">{category.name}</span>
              <span className="shrink-0 text-[10px] font-medium text-[var(--zed-text-muted)]">{category._count.products}</span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
