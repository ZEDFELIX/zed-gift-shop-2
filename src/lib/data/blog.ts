import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type BlogPostSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string | null;
  coverAlt: string | null;
  category: string;
  authorName: string | null;
  publishedAt: Date | null;
  readTime: string;
};

export type BlogPostFull = BlogPostSummary & { body: string; updatedAt: Date; seoTitle: string | null; seoDescription: string | null };

export const BLOG_PER_PAGE = 9;

function readTimeOf(body: string): string {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 210))} min`;
}

function publishedWhere(now: Date) {
  return { status: "PUBLISHED" as const, publishedAt: { not: null, lte: now } };
}

/** Published articles with search/category filters and pagination. */
export async function listPublishedBlogPosts(opts: {
  q?: string;
  category?: string;
  page?: number;
  perPage?: number;
}): Promise<{ posts: BlogPostSummary[]; total: number; page: number; pageCount: number }> {
  const perPage = Math.max(1, Math.min(24, opts.perPage ?? BLOG_PER_PAGE));
  const page = Math.max(1, Math.min(999, opts.page ?? 1));
  const start = (page - 1) * perPage;
  const q = opts.q?.trim() || "";
  const category = opts.category?.trim() || "";

  const filters: Prisma.BlogPostWhereInput[] = [publishedWhere(new Date())];
  if (category) filters.push({ category });
  if (q) {
    filters.push({
      OR: [
        { title: { contains: q, mode: "insensitive" as const } },
        { excerpt: { contains: q, mode: "insensitive" as const } },
        { body: { contains: q, mode: "insensitive" as const } },
      ],
    });
  }
  const where = { AND: filters };

  const [total, rows] = await Promise.all([
    prisma.blogPost.count({ where }),
    prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: start,
      take: perPage,
      select: {
        id: true, slug: true, title: true, excerpt: true, body: true,
        coverImage: true, coverAlt: true, category: true,
        authorName: true, publishedAt: true,
      },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const posts = rows.map((r) => ({
    id: r.id, slug: r.slug, title: r.title, excerpt: r.excerpt,
    coverImage: r.coverImage, coverAlt: r.coverAlt, category: r.category,
    authorName: r.authorName, publishedAt: r.publishedAt, readTime: readTimeOf(r.body),
  }));

  return { posts, total, page: Math.min(page, pageCount), pageCount };
}

/** The newest published article, used as the featured card on /blog. */
export async function getFeaturedBlogPost(): Promise<BlogPostSummary | null> {
  const post = await prisma.blogPost.findFirst({
    where: publishedWhere(new Date()),
    orderBy: { publishedAt: "desc" },
    select: {
      id: true, slug: true, title: true, excerpt: true, body: true,
      coverImage: true, coverAlt: true, category: true, authorName: true, publishedAt: true,
    },
  });
  if (!post) return null;
  return {
    id: post.id, slug: post.slug, title: post.title, excerpt: post.excerpt,
    coverImage: post.coverImage, coverAlt: post.coverAlt, category: post.category,
    authorName: post.authorName, publishedAt: post.publishedAt, readTime: readTimeOf(post.body),
  };
}

export async function getPublishedBlogPost(slug: string): Promise<BlogPostFull | null> {
  const post = await prisma.blogPost.findFirst({
    where: { slug, ...publishedWhere(new Date()) },
  });
  if (!post) return null;
  return {
    id: post.id, slug: post.slug, title: post.title, excerpt: post.excerpt,
    body: post.body, coverImage: post.coverImage, coverAlt: post.coverAlt,
    category: post.category, authorName: post.authorName,
    publishedAt: post.publishedAt, readTime: readTimeOf(post.body), updatedAt: post.updatedAt,
    seoTitle: post.seoTitle, seoDescription: post.seoDescription,
  };
}

export async function listBlogCategories(): Promise<string[]> {
  const rows = await prisma.blogPost.groupBy({ by: ["category"], where: publishedWhere(new Date()) });
  return rows.map((r) => r.category).sort((a, b) => a.localeCompare(b));
}

export async function relatedBlogPosts(category: string, excludeId: string, take = 3): Promise<BlogPostSummary[]> {
  const base = publishedWhere(new Date());
  const sameCategory = await prisma.blogPost.findMany({
    where: { ...base, category, id: { not: excludeId } },
    orderBy: { publishedAt: "desc" },
    take,
    select: {
      id: true, slug: true, title: true, excerpt: true, body: true,
      coverImage: true, coverAlt: true, category: true, authorName: true, publishedAt: true,
    },
  });
  if (sameCategory.length >= take) {
    return sameCategory.map((r) => ({ ...r, readTime: readTimeOf(r.body) }));
  }
  const fillers = await prisma.blogPost.findMany({
    where: { ...base, id: { notIn: [excludeId, ...sameCategory.map((r) => r.id)] } },
    orderBy: { publishedAt: "desc" },
    take: take - sameCategory.length,
    select: {
      id: true, slug: true, title: true, excerpt: true, body: true,
      coverImage: true, coverAlt: true, category: true, authorName: true, publishedAt: true,
    },
  });
  return [...sameCategory, ...fillers].map((r) => ({ ...r, readTime: readTimeOf(r.body) }));
}

/** All posts for the admin dashboard, newest activity first. */
export async function listAllBlogPostsForAdmin() {
  return prisma.blogPost.findMany({
    orderBy: [{ updatedAt: "desc" }],
    take: 200,
    select: {
      id: true, slug: true, title: true, excerpt: true, body: true,
      coverImage: true, coverAlt: true, category: true, authorName: true,
      seoTitle: true, seoDescription: true, status: true, publishedAt: true,
      createdAt: true, updatedAt: true,
    },
  });
}

/** Maps an article's category to a relevant, real shop path for the end CTA. */
const CATEGORY_CTAS: Record<string, { label: string; href: string }> = {
  Delivery: { label: "Shop same-day gifts", href: "/shop" },
  "Gifting tips": { label: "Shop couple gifts", href: "/product-category/couple-watches" },
  Corporate: { label: "Corporate gifting", href: "/wholesale" },
  Guides: { label: "Shop personalized gifts", href: "/product-category/personalized-gifts" },
  Personalized: { label: "Shop personalized gifts", href: "/product-category/personalized-gifts" },
  "Gifts for Him": { label: "Gifts for him", href: "/product-category/men-gifts" },
  Lifestyle: { label: "Shop sneakers", href: "/product-category/shoes-for-men/shoes/men-sneakers" },
};

export function getBlogPostCta(category: string) {
  return CATEGORY_CTAS[category] ?? { label: "Shop all gifts", href: "/shop" };
}
