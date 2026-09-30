import "server-only";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getBlogPosts } from "@/lib/data/blog";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Gift Journal",
  path: "/blog",
  description: "Gifting ideas, delivery guides and personalization tips from the ZED GIFT SHOP journal.",
});

export default function BlogIndexPage() {
  const posts = getBlogPosts();
  return (
    <div className="container-zed py-10 lg:py-14">
      <header className="mb-8 max-w-2xl">
        <p className="eyebrow">Journal</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-[#171717] lg:text-4xl">Gifting, done thoughtfully</h1>
        <p className="mt-3 leading-relaxed text-[#171717]">
          Occasion ideas, delivery know-how and personalization tips - written by the people who pack your gifts.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="glass-card group block rounded-zed p-6 transition-all hover:-translate-y-1 hover:shadow-glass-lg"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-soft-sage">
              {post.category} - {post.date}
            </p>
            <h2 className="mt-2 font-display text-xl font-bold leading-snug text-[#171717] group-hover:text-deep-olive">
              {post.title}
            </h2>
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#6B6B6B]">{post.excerpt}</p>
            <p className="mt-4 flex items-center gap-1.5 text-sm font-bold text-deep-olive">
              Read more <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}