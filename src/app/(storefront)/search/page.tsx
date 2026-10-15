import { ListingPage } from "@/components/shop/ListingPage";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
 const sp = await searchParams;
 const raw = sp.q;
 const q = (Array.isArray(raw) ? raw[0] : raw) ?? "";
 return buildMetadata({
 title: q ? `Search: ${q}` : "Search",
 path: `/search?q=${encodeURIComponent(q)}`,
 noindex: true,
 });
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
 const sp = await searchParams;
 const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q) ?? "";
 const page = sp.page ? Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1 : 1;

 return (
 <ListingPage
 title={q ? `Results for "${q}"` : "Search gifts"}
 eyebrow="Search"
 description={q ? undefined : "Type a gift, occasion, recipient or budget to get started."}
 filters={{ q: q || undefined, page }}
 href={`/search?q=${encodeURIComponent(q)}`}
 />
 );
}