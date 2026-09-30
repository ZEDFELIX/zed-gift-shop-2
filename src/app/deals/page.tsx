import { ListingPage } from "@/components/shop/ListingPage";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
 title: "Deals & Offers",
 path: "/deals",
 description: "Today's best deals on personalized gifts and gift boxes - limited-time savings, delivered across Kenya.",
});

export default async function DealsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
 const sp = await searchParams;
 const page = sp.page ? Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1 : 1;
 return (
 <ListingPage
 title="Today's Deals"
 eyebrow="Limited time"
 description="Save on customer favourites while stock lasts. Prices shown include all savings."
 filters={{ deals: true, sort: "price-desc", page }}
 href="/deals"
 />
 );
}