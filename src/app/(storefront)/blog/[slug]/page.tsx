import "server-only";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { getBlogPost } from "@/lib/data/blog";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  return buildMetadata({
    title: post.title,
    path: `/blog/${post.slug}`,
    description: post.excerpt,
    type: "article",
    publishedTime: post.date,
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  return (
    <div className="container-zed py-10 lg:py-14">
      <article className="mx-auto max-w-2xl">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-bold text-deep-olive transition-colors hover:text-zed-900">
          <ArrowLeft className="size-4" /> All articles
        </Link>
        <header className="mt-6">
          <p className="eyebrow">{post.category}</p>
          <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-[#07111F] lg:text-4xl">{post.title}</h1>
          <p className="mt-4 flex items-center gap-3 text-sm text-[#334155]">
            <span>{post.date}</span>
            <span className="flex items-center gap-1.5"><Clock className="size-3.5" /> {post.readTime} read</span>
          </p>
          <p className="mt-4 text-lg leading-relaxed text-[#07111F]">{post.excerpt}</p>
        </header>
        <div className="mt-8 space-y-6 border-t border-edge-strong/40 pt-8">
          {post.content.map((block, i) => (
            <section key={i}>
              {block.heading ? (
                <h2 className="font-display text-xl font-bold text-[#07111F]">{block.heading}</h2>
              ) : null}
              <p className="mt-2 leading-relaxed text-[#07111F]">{block.body}</p>
            </section>
          ))}
        </div>
        <div className="mt-10 rounded-zed bg-zed-950 px-6 py-6 text-center text-white">
          <p className="font-display text-lg font-bold">Ready to send something thoughtful?</p>
          <p className="mt-1 text-sm text-white/70">Browse the catalogue or build a gift from scratch.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href="/shop" className="rounded-zed bg-white px-5 py-2.5 text-sm font-bold text-[#07111F] transition-colors hover:bg-gold">
              Shop all gifts
            </Link>
            <Link href="/gift-builder" className="rounded-zed border border-white/30 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/10">
              Build a gift
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}