import "server-only";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/blog-format";

export const blogPostSchema = z.object({
  title: z.string().trim().min(3, "Give the article a title (at least 3 characters).").max(160),
  slug: z.string().trim().max(120).optional().or(z.literal("")),
  excerpt: z.string().trim().min(10, "Write a short excerpt (at least 10 characters).").max(400, "Keep the excerpt under 400 characters."),
  body: z.string().trim().min(40, "Article body needs at least 40 characters.").max(50000, "Article body is too long."),
  category: z.string().trim().min(2, "Choose or enter a category.").max(60),
  authorName: z.string().trim().max(80).optional().or(z.literal("")),
  coverImage: z.string().trim().max(500).optional().or(z.literal("")),
  coverAlt: z.string().trim().max(220).optional().or(z.literal("")),
  seoTitle: z.string().trim().max(160).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(300).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

export type BlogPostInput = z.infer<typeof blogPostSchema>;

/** Only http(s) or site-relative URLs are accepted for covers. */
function normalizeCover(url: string): string | null {
  if (!url) return null;
  if (/^https?:\/\/\S+$/i.test(url)) return url;
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  return null;
}

/** Strips control characters before content is stored. */
export function sanitizeBlogPost(d: BlogPostInput) {
  const strip = (v: string) => v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  const coverImage = normalizeCover(d.coverImage || "");
  return {
    title: strip(d.title),
    excerpt: strip(d.excerpt),
    body: strip(d.body).replace(/\r\n?/g, "\n"),
    category: strip(d.category),
    authorName: d.authorName || null,
    coverImage,
    coverAlt: coverImage ? d.coverAlt || null : null,
    seoTitle: d.seoTitle || null,
    seoDescription: d.seoDescription || null,
  };
}

/** Finds a collision-free slug, trying -2, -3, ... suffixes. */
export async function resolveBlogSlug(base: string, excludeId?: string): Promise<string> {
  const initial = slugify(base);
  let candidate = initial || `article-${Date.now()}`;
  for (let i = 0; i < 8; i++) {
    const clash = await prisma.blogPost.findFirst({
      where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    if (!clash) return candidate;
    candidate = `${initial || "article"}-${i + 2}`;
  }
  return `article-${Date.now()}`;
}
