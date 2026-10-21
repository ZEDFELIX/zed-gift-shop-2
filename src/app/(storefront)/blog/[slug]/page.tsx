import "server-only";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, MessageCircle, Share2, User } from "lucide-react";
import { getPublishedBlogPost, relatedBlogPosts, getBlogPostCta } from "@/lib/data/blog";
import { formatBlogDate, parseBlogBody, type InlineToken } from "@/lib/blog-format";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { SITE } from "@/lib/constants";
import { getSetting } from "@/lib/data/settings";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

function abs(url: string): string {
  if (/^https?:\/\//.test(url)) return url;
  return `${SITE.url}${url.startsWith("/") ? url : `/${url}`}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await getPublishedBlogPost(slug);
    if (!post) return {};
    const description = post.seoDescription?.trim() || post.excerpt;
    const image = post.coverImage ? abs(post.coverImage) : undefined;
    return {
      title: post.seoTitle?.trim() || post.title,
      description,
      alternates: { canonical: abs(`/blog/${post.slug}`) },
      openGraph: {
        type: "article",
        url: abs(`/blog/${post.slug}`),
        title: post.seoTitle?.trim() || post.title,
        description,
        siteName: SITE.name,
        ...(post.publishedAt ? { publishedTime: new Date(post.publishedAt).toISOString() } : {}),
        ...(image ? { images: [{ url: image, secureUrl: image, alt: post.coverAlt || post.title, width: 1200, height: 675 }] } : {}),
      },
      twitter: {
        card: image ? "summary_large_image" : "summary",
        title: post.seoTitle?.trim() || post.title,
        description,
        ...(image ? { images: [image] } : {}),
      },
    };
  } catch {
    return {};
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  let post;
  try {
    post = await getPublishedBlogPost(slug);
  } catch {
    notFound();
  }
  if (!post) notFound();

  const [related, whatsappRaw] = await Promise.all([
    relatedBlogPosts(post.category, post.id).catch(() => []),
    getSetting("whatsappNumber").catch(() => null),
  ]);
  const whatsappNumber = (typeof whatsappRaw === "string" && whatsappRaw.trim()) || SITE.whatsappNumber;
  const articleUrl = abs(`/blog/${post.slug}`);
  const shareText = encodeURIComponent(`${post.title} - ${articleUrl}`);
  const share = {
    whatsapp: `https://wa.me/?text=${shareText}`,
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(articleUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`,
  };
  const blocks = parseBlogBody(post.body);
  const cta = getBlogPostCta(post.category);
  const date = formatBlogDate(post.publishedAt);
  const pubIso = post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seoDescription?.trim() || post.excerpt,
    ...(post.coverImage ? { image: [abs(post.coverImage)] } : {}),
    datePublished: pubIso,
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Organization", name: post.authorName?.trim() || SITE.name },
    publisher: { "@type": "Organization", name: SITE.name, logo: { "@type": "ImageObject", url: `${SITE.url.replace(/\/$/, "")}/icon.png` } },
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
  };

  return (
    <div className="container-zed py-10 lg:py-14">
      <article className="mx-auto max-w-3xl">
        <nav aria-label="Breadcrumb" className="mb-6">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-bold text-deep-olive transition-colors hover:text-zed-900">
            <ArrowLeft className="size-4" /> All articles
          </Link>
        </nav>
        <header>
          <p className="eyebrow">{post.category}</p>
          <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-[#07111F] lg:text-4xl">{post.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#334155]">
            {post.authorName && (
              <span className="flex items-center gap-1.5">
                <span className="grid size-7 place-items-center rounded-full bg-rose-50 font-display text-xs font-bold text-[var(--color-rose-500)]" aria-hidden="true">
                  {post.authorName.trim().charAt(0).toUpperCase()}
                </span>
                <User className="sr-only" />
                <span className="font-semibold text-[#07111F]">{post.authorName}</span>
              </span>
            )}
            {date && <time dateTime={pubIso}>{date}</time>}
            <span className="flex items-center gap-1.5"><Clock className="size-3.5" /> {post.readTime} read</span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Share this article">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-charcoal/50">
              <Share2 className="size-3.5" aria-hidden="true" /> Share
            </span>
            <a href={share.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp" className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm transition-colors hover:bg-emerald-50">
              <MessageCircle className="size-3.5" aria-hidden="true" /> WhatsApp
            </a>
            <a href={share.x} target="_blank" rel="noopener noreferrer" aria-label="Share on X" className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#07111F] shadow-sm transition-colors hover:bg-charcoal/5">
              X
            </a>
            <a href={share.facebook} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook" className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#07111F] shadow-sm transition-colors hover:bg-charcoal/5">
              Facebook
            </a>
          </div>
        </header>

        <div className="mt-6">
          {post.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.coverImage} alt={post.coverAlt || post.title} loading="eager" decoding="async" fetchPriority="high" className="aspect-[16/9] w-full rounded-zed border border-edge object-cover shadow-glass" />
          ) : (
            <div className="grid aspect-[16/9] w-full place-items-center rounded-zed border border-edge bg-gradient-to-br from-rose-50 to-zed-950/5">
              <span className="font-display text-5xl font-black tracking-widest text-[var(--color-rose-500)]/20">ZED</span>
            </div>
          )}
        </div>

        <p className="mt-6 text-lg leading-relaxed text-[#334155]">{post.excerpt}</p>

        <div className="mt-6 space-y-5 border-t border-edge-strong/40 pt-6">
          {blocks.map((block, i) => {
            if (block.type === "h2") {
              return (
                <h2 key={i} className="pt-3 font-display text-2xl font-bold text-[#07111F]">{block.text}</h2>
              );
            }
            if (block.type === "ul") {
              return (
                <ul key={i} className="space-y-1.5 pl-1">
                  {block.items.map((tokens, j) => (
                    <li key={j} className="flex gap-2 leading-relaxed text-[#07111F]">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--color-rose-500)]/60" aria-hidden="true" />
                      <InlineText tokens={tokens} />
                    </li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={i} className="leading-relaxed text-[#07111F]">
                <InlineText tokens={block.tokens} />
              </p>
            );
          })}
        </div>

        <div className="mt-10 rounded-zed bg-zed-950 px-6 py-6 text-center text-white">
          <p className="font-display text-lg font-bold">Ready to send something thoughtful?</p>
          <p className="mt-1 text-sm text-white/70">Browse the catalogue or build a gift from scratch.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href={cta.href} className="rounded-zed bg-soft-sage px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-zed-900">
              {cta.label}
            </Link>
            <Link href="/shop" className="rounded-zed bg-white px-5 py-2.5 text-sm font-bold text-[#07111F] transition-colors hover:bg-gold">
              Shop all gifts
            </Link>
            <Link href="/gift-builder" className="rounded-zed border border-white/30 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/10">
              Build a gift
            </Link>
          </div>
        </div>

        {related.length > 0 && (
          <section aria-label="Related articles" className="mt-12">
            <h2 className="font-display text-xl font-bold text-[#07111F]">Keep reading</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              {related.map((rp) => (
                <BlogPostCard key={rp.id} post={rp} sizes="(min-width: 640px) 220px, 100vw" />
              ))}
            </div>
          </section>
        )}
      </article>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}

function InlineText({ tokens }: { tokens: InlineToken[] }) {
  return (
    <>
      {tokens.map((t, i) =>
        t.kind === "link" ? (
          <a key={i} href={t.url} className="font-semibold text-[var(--color-rose-500)] underline underline-offset-2 hover:text-[var(--color-rose-700)]">
            {t.text}
          </a>
        ) : (
          <span key={i}>{t.text}</span>
        ),
      )}
    </>
  );
}
