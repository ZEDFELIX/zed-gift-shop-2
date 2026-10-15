import "server-only";

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { resolveCategoryPath } from "@/lib/data/categories";
import { ListingPage } from "@/components/shop/ListingPage";
import { buildMetadata, jsonLdBreadcrumb } from "@/lib/seo";
import { SITE } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string[] }> };

function boolParam(value: string | string[] | undefined) {
  const v = Array.isArray(value) ? value[0] : value;
  return v === "1" || v === "true";
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const category = await resolveCategoryPath(slug).catch(() => null);
  if (!category) return buildMetadata({ title: "Category not found", path: `/product-category/${slug.join("/")}`, noindex: true });

  const path = `/product-category/${slug.join("/")}`;
  return buildMetadata({
    title: category.seoTitle ?? `${category.name} in Kenya`,
    description:
      category.seoDescription ??
      category.description ??
      `Shop ${category.name.toLowerCase()} at ${SITE.name}. Premium quality, personalization available and same-day delivery in Nairobi.`,
    path,
  });
}

export default async function ProductCategoryPage({
  params,
  searchParams,
}: Params & { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const category = await resolveCategoryPath(slug).catch(() => null);
  if (!category) notFound();

  // Canonical path from the resolved parent chain so child links stay correct
  // even when a visitor lands on a short or mismatched URL.
  const categoryPath = category.breadcrumb.map((b) => b.href.replace("/product-category/", ""));
  const canonicalHref = `/product-category/${categoryPath.join("/")}`;

  const get = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const breadcrumbLd = jsonLdBreadcrumb([
    { name: "Home", path: "/" },
    ...category.breadcrumb.map((b) => ({ name: b.name, path: b.href })),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <div className="container-zed pt-6">
        <nav aria-label="Breadcrumb" className="text-[13px] text-charcoal/65">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-soft-sage">Home</Link>
            </li>
            {category.breadcrumb.map((b, i) => (
              <li key={b.href} className="flex items-center gap-1.5">
                <span aria-hidden>&middot;</span>
                {i === category.breadcrumb.length - 1 ? (
                  <span className="font-semibold text-[var(--color-ink)]">{b.name}</span>
                ) : (
                  <Link href={b.href} className="hover:text-soft-sage">{b.name}</Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {category.children.length > 0 && (
        <div className="container-zed mt-5">
          <div className="flex flex-wrap gap-2">
            {category.children.map((child) => (
              <Link
                key={child.id}
                href={`/product-category/${[...categoryPath, child.slug].join("/")}`}
                className="rounded-md border border-edge bg-panel/50 px-3.5 py-2 text-sm font-medium text-[var(--color-ink)] transition-colors hover:border-soft-sage hover:text-soft-sage"
              >
                {child.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <ListingPage
        title={category.name}
        eyebrow="Product Category"
        description={category.description ?? undefined}
        filters={{
          category: category.slug,
          q: get("q"),
          min: get("min_price") ? Number(get("min_price")) : undefined,
          max: get("max_price") ? Number(get("max_price")) : undefined,
          personalized: boolParam(get("personalized")),
          inStock: boolParam(get("inStock")),
          sort: get("sort"),
          page: get("page") ? Number(get("page")) : 1,
        }}
        href={canonicalHref}
      />
    </>
  );
}
