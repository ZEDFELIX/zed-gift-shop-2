import { notFound } from "next/navigation";
import { ListingPage } from "@/components/shop/ListingPage";
import { getCategoryBySlug, getGiftPageContent } from "@/lib/data/catalog";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
 const { slug } = await params;
 const category = await getCategoryBySlug(slug);
 const fallback = await getGiftPageContent(slug);
 if (!category && !fallback.fallback) return {};
 return buildMetadata({
 title: fallback.title,
 path: `/gifts/${slug}`,
 description: (category?.seoDescription ?? fallback.description) || undefined,
 });
}

export default async function GiftCategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
 const { slug } = await params;
 const sp = await searchParams;
 const page = sp.page ? Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1 : 1;
 const content = await getGiftPageContent(slug);
 if (!content.fallback && !(await getCategoryBySlug(slug))) notFound();

 const kind = (await getCategoryBySlug(slug))?.kind ?? "OCCASION";

 return (
 <ListingPage
 key={slug}
 title={content.title}
 eyebrow={kind === "RECIPIENT" ? "Shop by recipient" : "Shop by occasion"}
 description={content.description || undefined}
 filters={kind === "RECIPIENT" ? { recipient: slug, page } : { occasion: slug, page }}
 href={`/gifts/${slug}`}
 />
 );
}