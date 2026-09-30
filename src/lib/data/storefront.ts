import { prisma } from "@/lib/prisma";
import { NAV_GROUPS } from "@/lib/constants";
import { discountPercent } from "@/lib/utils";
import { productInclude } from "@/lib/data/products";

export type MenuFeatured = {
  slug: string;
  name: string;
  price: number;
  compareAt: number | null;
  image: string | null;
  alt: string;
  sale: number | null;
};

function slugFromHref(href: string): string | null {
  const match = href.match(/^\/product-category\/([^/?#]+)/);
  return match ? match[1] : null;
}

export type NavFeaturedMap = Record<string, MenuFeatured | null>;

/**
 * Resolves one carousel product per primary nav group, matching the
 * source storefront where every mega menu panel ends in a featured product.
 */
export async function getNavFeatured(): Promise<NavFeaturedMap> {
  const slugs = NAV_GROUPS.map((g) => slugFromHref(g.href)).filter((s): s is string => Boolean(s));
  if (slugs.length === 0) return {};

  const rows = await prisma.product
    .findMany({
      where: {
        status: "ACTIVE",
        images: { some: {} },
        categories: { some: { category: { slug: { in: slugs } } } },
      },
      include: productInclude,
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    })
    .catch(() => []);

  const byCategory = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    for (const link of row.categories) {
      const categorySlug = link.category.slug;
      if (!slugs.includes(categorySlug)) continue;
      const current = byCategory.get(categorySlug);
      if (!current || (row.featured && !current.featured)) byCategory.set(categorySlug, row);
    }
  }

  const out: NavFeaturedMap = {};
  for (const group of NAV_GROUPS) {
    const slug = slugFromHref(group.href);
    if (!slug) {
      out[group.label] = null;
      continue;
    }
    const product = byCategory.get(slug);
    out[group.label] = product
      ? {
        slug: product.slug,
        name: product.name,
        price: product.price,
        compareAt: product.compareAtPrice,
        image: product.images[0]?.url ?? null,
        alt: product.images[0]?.alt ?? product.name,
        sale: discountPercent(product.price, product.compareAtPrice),
      }
      : null;
  }
  return out;
}
