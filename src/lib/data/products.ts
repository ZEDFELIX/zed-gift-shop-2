import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type ProductListFilters = {
 q?: string;
 category?: string;
 occasion?: string;
 recipient?: string;
 collection?: string;
 min?: number;
 max?: number;
 personalized?: boolean;
 inStock?: boolean;
 deals?: boolean;
 rating?: number;
 sort?: string;
 page?: number;
 pageSize?: number;
 categoryKind?: "CATEGORY" | "OCCASION" | "RECIPIENT";
};

export const productInclude = {
 images: { orderBy: { sortOrder: "asc" as const } },
 categories: { include: { category: true } },
 collections: { include: { collection: true } },
 variants: { where: { active: true }, orderBy: { name: "asc" as const } },
} satisfies Prisma.ProductInclude;

export type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

export function productSeoTitle(p: { name: string; headline?: string | null }) {
 return p.headline ? `${p.name} - ${p.headline}` : p.name;
}

export async function getProductBySlug(slug: string) {
 return prisma.product.findUnique({
 where: { slug, status: "ACTIVE" },
 include: productInclude,
 });
}

export async function getProductByIdForAdmin(id: string) {
 return prisma.product.findUnique({
 where: { id },
 include: productInclude,
 });
}

export async function getRelatedProducts(productId: string, categoryIds: string[], limit = 4) {
 if (categoryIds.length === 0) return [];
 return prisma.product.findMany({
 where: {
 id: { not: productId },
 status: "ACTIVE",
 categories: { some: { categoryId: { in: categoryIds } } },
 },
 include: productInclude,
 take: limit,
 });
}

export async function getTrendingProducts(limit = 8) {
 return prisma.product.findMany({
 where: { status: "ACTIVE" },
 include: productInclude,
 orderBy: [{ ratingAverage: "desc" }, { ratingCount: "desc" }],
 take: limit,
 });
}

export async function getFeaturedProducts(limit = 8) {
 return prisma.product.findMany({
 where: { status: "ACTIVE", featured: true },
 include: productInclude,
 orderBy: { publishedAt: "desc" },
 take: limit,
 });
}

export async function getDealProducts(limit = 12) {
  return prisma.product.findMany({
    where: { status: "ACTIVE", compareAtPrice: { not: null } },
    include: productInclude,
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}

export async function getBestSellerProducts(limit = 6) {
  return prisma.product.findMany({
    where: { status: "ACTIVE", bestSeller: true },
    include: productInclude,
    orderBy: [{ ratingAverage: "desc" }, { ratingCount: "desc" }],
    take: limit,
  });
}

export async function getMostBoughtProducts(limit = 6) {
  const rows = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      productId: { not: null },
      order: {
        paymentStatus: "SUCCESSFUL",
        orderStatus: { notIn: ["CANCELLED", "REFUNDED"] },
      },
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  const ids = rows.map((row) => row.productId).filter((id): id is string => Boolean(id));
  if (ids.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: ids }, status: "ACTIVE" },
    include: productInclude,
  });

  const rank = new Map(ids.map((id, index) => [id, index]));
  return products.sort((a, b) => (rank.get(a.id) ?? 999) - (rank.get(b.id) ?? 999));
}

export async function getFlashSaleProducts(limit = 6) {
  return prisma.product.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { tags: { has: "flash-sale" } },
        { tags: { has: "customer-service-week" } },
        { collections: { some: { collection: { slug: "customer-service-week" } } } },
      ],
    },
    include: productInclude,
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
    take: limit,
  });
}

// Every sort ends with a unique tiebreaker so that paginated listings stay
// stable even when the leading keys all tie (e.g. a freshly seeded catalogue
// where every product shares the same publishedAt).
const sortMap: Record<string, Prisma.ProductOrderByWithRelationInput[]> = {
  featured: [{ featured: "desc" }, { ratingAverage: "desc" }, { id: "asc" }],
  "price-asc": [{ price: "asc" }, { id: "asc" }],
  "price-desc": [{ price: "desc" }, { id: "asc" }],
  new: [{ publishedAt: "desc" }, { id: "asc" }],
  newest: [{ publishedAt: "desc" }, { id: "asc" }],
  rating: [{ ratingAverage: "desc" }, { ratingCount: "desc" }, { id: "asc" }],
  name: [{ name: "asc" }, { id: "asc" }],
};

const DEFAULT_SORT: Prisma.ProductOrderByWithRelationInput[] = [
  { featured: "desc" },
  { publishedAt: "desc" },
  { id: "asc" },
];

const scopeCache = new Map<string, string[]>();

/**
 * Returns the ids of a category and every descendant, so a parent category
 * page also lists products filed under its subcategories.
 */
async function categoryScopeIds(slug: string): Promise<string[]> {
  const cached = scopeCache.get(slug);
  if (cached) return cached;

  const root = await prisma.category.findUnique({ where: { slug }, select: { id: true } });
  if (!root) {
    scopeCache.set(slug, []);
    return [];
  }

  const ids = [root.id];
  let frontier = [root.id];
  while (frontier.length > 0) {
    const children = await prisma.category.findMany({
      where: { parentId: { in: frontier } },
      select: { id: true },
    });
    const next = children.map((c) => c.id).filter((id) => !ids.includes(id));
    if (next.length === 0) break;
    ids.push(...next);
    frontier = next;
  }

  scopeCache.set(slug, ids);
  return ids;
}

export async function listProducts(filters: ProductListFilters) {
 const page = Math.max(1, filters.page ?? 1);
 const pageSize = Math.min(48, Math.max(1, filters.pageSize ?? 24));
 const sort = filters.sort && sortMap[filters.sort] ? filters.sort : "featured";

 const conditions: Prisma.ProductWhereInput[] = [{ status: "ACTIVE" }];

 if (filters.q) {
 conditions.push({
 OR: [
 { name: { contains: filters.q, mode: "insensitive" } },
 { headline: { contains: filters.q, mode: "insensitive" } },
 { description: { contains: filters.q, mode: "insensitive" } },
 { tags: { has: filters.q } },
 { sku: { equals: filters.q, mode: "insensitive" } },
 ],
 });
 }
  if (filters.category) {
    conditions.push({ categories: { some: { categoryId: { in: await categoryScopeIds(filters.category) } } } });
  }
 if (filters.occasion) {
 conditions.push({ categories: { some: { category: { slug: filters.occasion, kind: "OCCASION" } } } });
 }
 if (filters.recipient) {
 conditions.push({ categories: { some: { category: { slug: filters.recipient, kind: "RECIPIENT" } } } });
 }
 if (filters.collection) {
 conditions.push({ collections: { some: { collection: { slug: filters.collection } } } });
 }
 if (filters.personalized) conditions.push({ personalizationEnabled: true });
 if (filters.deals) conditions.push({ compareAtPrice: { not: null } });
 if (filters.categoryKind) {
 conditions.push({ categories: { some: { category: { kind: filters.categoryKind } } } });
 }

 const price: Prisma.IntFilter = {};
 if (filters.min != null) price.gte = filters.min;
 if (filters.max != null) price.lte = filters.max;
 if (filters.min != null || filters.max != null) conditions.push({ price });

 if (filters.inStock) {
 conditions.push({
 OR: [{ trackInventory: false }, { trackInventory: true, quantity: { gt: 0 } }],
 });
 }
 if (filters.rating) conditions.push({ ratingAverage: { gte: filters.rating } });

 const where: Prisma.ProductWhereInput = { AND: conditions };

 const [items, total] = await Promise.all([
 prisma.product.findMany({
 where,
 include: productInclude,
    orderBy: sortMap[sort] ?? DEFAULT_SORT,
 skip: (page - 1) * pageSize,
 take: pageSize,
 }),
 prisma.product.count({ where }),
 ]);

 const priceAgg = await prisma.product.aggregate({
 where,
 _min: { price: true },
 _max: { price: true },
 });

 return {
 items,
 total,
 page,
 pageSize,
 pages: Math.max(1, Math.ceil(total / pageSize)),
 minPrice: priceAgg._min.price ?? 0,
 maxPrice: priceAgg._max.price ?? 0,
 };
}

export async function getCategoryFacets(kind?: "CATEGORY" | "OCCASION" | "RECIPIENT") {
 const categories = await prisma.category.findMany({
 where: { active: true, ...(kind ? { kind } : {}) },
 include: { _count: { select: { products: true } } },
 orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
 });
 return categories;
}

export async function getCollectionFacets() {
 return prisma.collection.findMany({
 include: { _count: { select: { products: true } } },
 orderBy: { name: "asc" },
 });
}

export async function adminListProducts(opts: { q?: string; status?: string; page?: number; pageSize?: number }) {
 const page = Math.max(1, opts.page ?? 1);
 const pageSize = Math.min(100, opts.pageSize ?? 20);
 const where: Prisma.ProductWhereInput = {};
 if (opts.status) where.status = opts.status as Prisma.ProductWhereInput["status"];
 if (opts.q) {
 where.OR = [
 { name: { contains: opts.q, mode: "insensitive" } },
 { sku: { contains: opts.q, mode: "insensitive" } },
 { slug: { contains: opts.q, mode: "insensitive" } },
 ];
 }
 const [items, total] = await Promise.all([
 prisma.product.findMany({
 where,
 include: { images: { take: 1 }, categories: { include: { category: true } }, variants: true },
 orderBy: { updatedAt: "desc" },
 skip: (page - 1) * pageSize,
 take: pageSize,
 }),
 prisma.product.count({ where }),
 ]);
 return { items, total, page, pages: Math.max(1, Math.ceil(total / pageSize)) };
}