import { ListingPage } from "@/components/shop/ListingPage";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
 title: "Personalized Gifts",
 path: "/personalized",
 description: "Engraved, printed and made-to-order personalized gifts - add a name, date or message at checkout. Delivered across Kenya.",
});

export default async function PersonalizedPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
 const sp = await searchParams;
 const page = sp.page ? Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1 : 1;
 return (
 <ListingPage
 title="Personalized Gifts"
 eyebrow="Made extra special"
 description="Add a name, initials, a date or a short message on any personalized gift. Enter your wording at checkout - we'll craft it before dispatch."
 filters={{ personalized: true, page }}
 href="/personalized"
 />
 );
}