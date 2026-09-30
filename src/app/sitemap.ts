import type { MetadataRoute } from "next";
import { SITE, GIFT_ROUTES } from "@/lib/constants";
import { BLOG_POSTS } from "@/lib/data/blog";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = SITE.url;

  const staticRoutes = [
    "", "/shop", "/search", "/deals", "/collections", "/gifts", "/personalized", "/wishlist",
    "/gift-builder", "/gift-finder", "/track", "/contact", "/about", "/policies/delivery", "/policies/privacy",
    "/policies/terms", "/login", "/register", "/forgot-password", "/blog", "/cards", "/wholesale", "/gifts-under-1000",
  ].map((p) => ({
    url: `${url}${p}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.8,
  }));

  const blogRoutes = BLOG_POSTS.map((p) => ({
    url: `${url}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Sitemap generation must not take the whole site down when the optional
  // production database is unavailable during a deployment or temporarily offline.
  let productRoutes: MetadataRoute.Sitemap = [];
  let collectionRoutes: MetadataRoute.Sitemap = [];
  let categoryRoutes: MetadataRoute.Sitemap = [];

  try {
    const [products, collections, categories] = await Promise.all([
      prisma.product.findMany({
        where: { status: "ACTIVE" },
        select: { slug: true, updatedAt: true },
      }),
      prisma.collection.findMany({ select: { slug: true, updatedAt: true } }),
      prisma.category.findMany({
        where: { active: true, kind: "CATEGORY" },
        select: { slug: true, updatedAt: true, parent: { select: { slug: true } } },
      }),
    ]);

    productRoutes = products.map((p) => ({
      url: `${url}/product/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));

    collectionRoutes = collections.map((c) => ({
      url: `${url}/collections/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    categoryRoutes = categories.map((c) => ({
      url: `${url}${c.parent ? `/product-category/${c.parent.slug}/${c.slug}` : `/product-category/${c.slug}`}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // Keep a valid static sitemap when DATABASE_URL is not configured.
  }

  const giftRoutes = GIFT_ROUTES.map((g) => ({
    url: `${url}${g.href}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...blogRoutes, ...productRoutes, ...collectionRoutes, ...categoryRoutes, ...giftRoutes];
}
