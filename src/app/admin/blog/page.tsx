import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listAllBlogPostsForAdmin } from "@/lib/data/blog";
import { BlogManager, type BlogAdminRow } from "@/components/admin/BlogManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Blog | Admin" };

export default async function AdminBlogPage() {
  const me = await getCurrentUser();
  if (me?.role !== "ADMIN") {
    return (
      <div className="rounded-zed border border-edge bg-white p-6">
        <h2 className="font-display text-xl font-bold text-[#07111F]">Restricted</h2>
        <p className="mt-1 text-sm text-[#334155]">Only the store owner can manage journal articles.</p>
        <Link href="/admin" className="mt-4 inline-block text-sm font-semibold text-soft-sage hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  let posts;
  try {
    posts = await listAllBlogPostsForAdmin();
  } catch {
    return (
      <div className="rounded-zed border border-edge bg-white p-6">
        <h2 className="font-display text-xl font-bold text-[#07111F]">Could not load articles</h2>
        <p className="mt-1 text-sm text-[#334155]">The blog database is not responding. Refresh to try again.</p>
      </div>
    );
  }

  const rows: BlogAdminRow[] = posts.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    body: p.body,
    category: p.category,
    authorName: p.authorName,
    coverImage: p.coverImage,
    coverAlt: p.coverAlt,
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
    status: p.status,
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
    updatedAt: p.updatedAt.toISOString(),
  }));

  return <BlogManager initial={rows} />;
}
