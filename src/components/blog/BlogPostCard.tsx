import Link from "next/link";
import { ArrowRight, Clock, User } from "lucide-react";
import { formatBlogDate } from "@/lib/blog-format";
import type { BlogPostSummary } from "@/lib/data/blog";

export function BlogCover({ post, sizes = "(min-width: 1024px) 380px, 100vw" }: { post: { coverImage: string | null; coverAlt: string | null; title: string }; sizes?: string }) {
  if (post.coverImage) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={post.coverImage} alt={post.coverAlt || post.title} loading="lazy" decoding="async" className="aspect-[16/9] w-full rounded-xl border border-edge object-cover" />;
  }
  return (
    <div className="grid aspect-[16/9] w-full place-items-center rounded-xl border border-edge bg-gradient-to-br from-rose-50 to-zed-950/5">
      <span className="font-display text-2xl font-black tracking-widest text-[var(--color-rose-500)]/25">ZED</span>
    </div>
  );
}

export function BlogPostCard({ post, sizes }: { post: BlogPostSummary; sizes?: string }) {
  const date = formatBlogDate(post.publishedAt);
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="glass-card group flex flex-col overflow-hidden rounded-zed p-3 transition-all hover:-translate-y-1 hover:shadow-glass-lg"
    >
      <BlogCover post={post} sizes={sizes} />
      <div className="flex flex-1 flex-col px-2 pb-1 pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-soft-sage">
          {post.category} {date ? `- ${date}` : ""}
        </p>
        <h2 className="mt-1.5 font-display text-lg font-bold leading-snug text-[#07111F] group-hover:text-deep-olive">
          {post.title}
        </h2>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#334155]">{post.excerpt}</p>
        <div className="mt-3 flex flex-1 flex-wrap items-end justify-between gap-2 text-[11px] font-semibold text-charcoal/50">
          <span className="flex items-center gap-3">
            {post.authorName && (
              <span className="flex items-center gap-1">
                <User className="size-3" aria-hidden="true" /> <span>{post.authorName}</span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="size-3" aria-hidden="true" /> {post.readTime}
            </span>
          </span>
          <span className="flex items-center gap-1 font-bold text-deep-olive">
            Read <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
