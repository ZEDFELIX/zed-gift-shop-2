import { prisma } from "@/lib/prisma";
import { productInclude } from "@/lib/data/products";

export type ResolvedCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  parentId: string | null;
  children: { id: string; slug: string; name: string }[];
  breadcrumb: { name: string; href: string }[];
};

const CATEGORY_SELECT = {
  id: true,
  slug: true,
  name: true,
  description: true,
  image: true,
  seoTitle: true,
  seoDescription: true,
  parentId: true,
} as const;

export function categoryHref(slug: string): string {
  return `/product-category/${slug}`;
}

/**
 * Resolves a WooCommerce-style category path such as
 * ["corporate-gifts-kenya", "trophies-in-nairobi"] into a single category,
 * walking the parent chain so nested URLs resolve the same way they do
 * on the source storefront.
 */
export async function resolveCategoryPath(
  segments: string[],
): Promise<ResolvedCategory | null> {
  const slugs = segments.filter(Boolean);
  if (slugs.length === 0) return null;

  const leaf = await prisma.category.findUnique({
    where: { slug: slugs[slugs.length - 1] },
    select: CATEGORY_SELECT,
  });
  if (!leaf) return null;

  const chain = [leaf];
  let cursor = leaf;
  while (cursor.parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: cursor.parentId },
      select: CATEGORY_SELECT,
    });
    if (!parent) break;
    chain.unshift(parent);
    cursor = parent;
  }

  const children = await prisma.category.findMany({
    where: { parentId: leaf.id, active: true },
    select: { id: true, slug: true, name: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const breadcrumb = chain.map((c, i) => ({
    name: c.name,
    href: categoryHref(chain.slice(0, i + 1).map((x) => x.slug).join("/")),
  }));

  return { ...leaf, children, breadcrumb };
}

export async function listTopLevelCategories() {
  return prisma.category.findMany({
    where: { active: true, parentId: null, kind: "CATEGORY" },
    select: { id: true, slug: true, name: true, image: true, description: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function getCategoryProductCount(categoryId: string): Promise<number> {
  return prisma.productCategory.count({
    where: { categoryId, product: { status: "ACTIVE" } },
  });
}

export async function getCategoryFacetsFor(parentId: string | null) {
  return prisma.category.findMany({
    where: { active: true, parentId },
    include: { _count: { select: { products: true } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function listAllCategoryPaths(): Promise<{ slug: string; name: string; href: string }[]> {
  const rows = await prisma.category.findMany({
    where: { active: true, kind: "CATEGORY" },
    select: { slug: true, name: true, parent: { select: { slug: true } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    href: r.parent ? `/product-category/${r.parent.slug}/${r.slug}` : `/product-category/${r.slug}`,
  }));
}

export { productInclude };
