import "server-only";

import Link from "next/link";
import { ArrowRight, Search, X } from "lucide-react";
import { listPublishedBlogPosts, listBlogCategories, getFeaturedBlogPost } from "@/lib/data/blog";
import { BlogPostCard, BlogCover } from "@/components/blog/BlogPostCard";
import { formatBlogDate } from "@/lib/blog-format";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Gift Journal",
  path: "/blog",
  description: "Gifting ideas, delivery guides and personalization tips from the ZED GIFT SHOP journal.",
});

const PER_PAGE = 9;

function isBlank(v?: string) {
  return !v || !v.trim();
}

export default async function BlogIndexPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; page?: string }> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const category = sp.category?.trim() ?? "";
  const filtered = !isBlank(q) || !isBlank(category);
  const page = Math.max(1, Math.min(999, Number.parseInt(sp.page ?? "1", 10) || 1));

  let result;
  const categories: string[] = [];
  try {
    result = await listPublishedBlogPosts({ q, category, page, perPage: PER_PAGE });
    categories.push(...(await listBlogCategories()));
  } catch {
    return (
      <div className="container-zed py-14 lg:py-20">
        <div className="mx-auto max-w-xl glass-card rounded-zed p-8 text-center" role="alert">
          <p className="font-display text-xl font-bold text-[#07111F]">The journal is taking a short break.</p>
          <p className="mt-2 text-sm text-[#334155]">We could not load the articles just now. Please refresh in a moment, or continue browsing gifts in the meantime.</p>
          <Link href="/shop" className="mt-4 inline-block rounded-zed bg-deep-olive px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-zed-900">
            Shop all gifts
          </Link>
        </div>
      </div>
    );
  }

  const showsFeatured = !filtered && page === 1;
  const [featured, ...gridPosts] = showsFeatured && result.posts.length > 3 ? [result.posts[0], ...result.posts.slice(1)] : [null, ...result.posts];
  const featuredPost = featured && showsFeatured ? featured : null;
  const listed = featuredPost ? gridPosts : result.posts;

  const filterQueryString = (patch: { q?: string; category?: string; page?: string }) => {
    const params = new URLSearchParams();
    const next = { q, category, page: String(page), ...patch };
    if (next.q) params.set("q", next.q);
    if (next.category) params.set("category", next.category);
    if (next.page && next.page !== "1") params.set("page", next.page);
    const s = params.toString();
    return s ? `/blog?${s}` : "/blog";
  };

  return (
    <div className="container-zed py-10 lg:py-14">
      <header className="mb-8 max-w-2xl">
        <p className="eyebrow">Journal</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-[#07111F] lg:text-4xl">Gifting, done thoughtfully</h1>
        <p className="mt-3 leading-relaxed text-[#07111F]">
          Occasion ideas, delivery know-how and personalization tips - written by the people who pack your gifts.
        </p>
      </header>

      {/* Search + category filters */}
      <form role="search" action="/blog" method="get" className="mb-6 flex flex-col gap-2 sm:flex-row">
        <div className="field flex flex-row items-center gap-2 py-2.5">
          <Search className="size-4 shrink-0 text-soft-sage" aria-hidden="true" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search articles..."
            aria-label="Search articles"
            className="w-full border-0 bg-transparent text-sm font-medium outline-none placeholder:text-charcoal/40"
          />
          {category && <input type="hidden" name="category" value={category} />}
        </div>
        <button type="submit" className="shrink-0 rounded-zed bg-deep-olive px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-zed-900">
          Search
        </button>
      </form>
      <nav aria-label="Article categories" className="mb-8 flex flex-wrap items-center gap-2">
        <Link
          href={filterQueryString({ category: "", page: "1" })}
          className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors ${!category ? "bg-deep-olive text-white" : "bg-white text-[#334155] shadow-sm hover:text-deep-olive"}`}
        >
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c}
            href={filterQueryString({ category: c, page: "1" })}
            className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors ${category === c ? "bg-deep-olive text-white" : "bg-white text-[#334155] shadow-sm hover:text-deep-olive"}`}
          >
            {c}
          </Link>
        ))}
        {filtered && (
          <Link href="/blog" className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100">
            <X className="size-3.5" aria-hidden="true" /> Clear filters
          </Link>
        )}
      </nav>

      {/* States */}
      {result.posts.length === 0 && !featuredPost ? (
        filtered ? (
          <div className="glass-card rounded-zed p-10 text-center">
            <p className="font-display text-xl font-bold text-[#07111F]">No articles match your search</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#334155]">
              {q ? <>Nothing in the journal matched &ldquo;{q}&rdquo;{category ? ` in ${category}` : ""}. Try a shorter phrase, or clear the filters to browse everything.</> : <>There are no articles in {category} yet. Try another category, or browse all articles.</>}
            </p>
            <Link href="/blog" className="mt-4 inline-block rounded-zed bg-deep-olive px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-zed-900">
              Browse all articles
            </Link>
          </div>
        ) : (
          <div className="glass-card rounded-zed p-10 text-center">
            <p className="font-display text-xl font-bold text-[#07111F]">Stories are on their way</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#334155]">
              Our journal launches soon. Until then, the full gift collection is open for browsing.
            </p>
            <Link href="/shop" className="mt-4 inline-block rounded-zed bg-deep-olive px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-zed-900">
              Shop all gifts
            </Link>
          </div>
        )
      ) : (
        <>
          {/* Featured article */}
          {featuredPost && (
            <section aria-label="Featured article" className="mb-10">
              <p className="eyebrow mb-3">Featured</p>
              <Link href={`/blog/${featuredPost.slug}`} className="glass-card group grid gap-4 overflow-hidden rounded-zed p-4 transition-all hover:shadow-glass-lg sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] sm:p-5">
                <div>
                  <figure className="m-0 p-0">
                    <BlogCover post={featuredPost} sizes="(min-width: 640px) 560px, 100vw" />
                    <figcaption className="mt-2 text-sm font-semibold text-charcoal/50">
                      {featuredPost.category} · {formatBlogDate(featuredPost.publishedAt) ?? ""}
                    </figcaption>
                  </figure>
                </div>
                <div className="flex flex-col justify-center py-1 pr-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-soft-sage">
                    {featuredPost.category} {formatBlogDate(featuredPost.publishedAt) ? `- ${formatBlogDate(featuredPost.publishedAt)}` : ""}
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-bold leading-tight text-[#07111F] group-hover:text-deep-olive lg:text-3xl">
                    {featuredPost.title}
                  </h2>
                  <p className="mt-3 line-clamp-3 leading-relaxed text-[#334155]">{featuredPost.excerpt}</p>
                  <p className="mt-4 flex items-center gap-2 text-sm font-bold text-deep-olive">
                    Read the article <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </p>
                </div>
              </Link>
            </section>
          )}

          {/* Latest articles */}
          {listed.length > 0 && (
            <section aria-label="Latest articles">
              {featuredPost && <p className="eyebrow mb-3">Latest articles</p>}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {listed.map((post) => (
                  <BlogPostCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          )}

          {/* Pagination */}
          {result.pageCount > 1 && (
            <nav aria-label="Blog pages" className="mt-8 flex items-center justify-center gap-3">
              {result.page > 1 ? (
                <Link rel="prev" href={filterQueryString({ page: String(result.page - 1) })} className="rounded-zed glass-panel px-4 py-2 text-sm font-bold text-[#07111F] hover:text-deep-olive">
                  &larr; Previous
                </Link>
              ) : null}
              <span className="text-sm text-charcoal/55">Page {result.page} of {result.pageCount}</span>
              {result.page < result.pageCount ? (
                <Link rel="next" href={filterQueryString({ page: String(result.page + 1) })} className="rounded-zed glass-panel px-4 py-2 text-sm font-bold text-[#07111F] hover:text-deep-olive">
                  Next &rarr;
                </Link>
              ) : null}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
