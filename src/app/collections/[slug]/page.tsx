import { notFound } from "next/navigation";
import { ListingPage } from "@/components/shop/ListingPage";
import { getCollectionBySlug } from "@/lib/data/catalog";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
 const { slug } = await params;
 const collection = await getCollectionBySlug(slug);
 if (!collection) return {};
 return buildMetadata({
 title: collection.name,
 path: `/collections/${slug}`,
 description: collection.seoDescription ?? collection.description ?? undefined,
 });
}

export default async function CollectionPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
 const { slug } = await params;
 const sp = await searchParams;
 const page = sp.page ? Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1 : 1;
 const collection = await getCollectionBySlug(slug);
 if (!collection) notFound();

 return (
 <ListingPage
 title={collection.name}
 eyebrow="Collection"
 description={collection.description ?? undefined}
 filters={{ collection: collection.slug, page }}
 href={`/collections/${collection.slug}`}
 />
 );
}