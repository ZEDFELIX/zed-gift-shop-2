import { buildMetadata } from "@/lib/seo";
import { ListingPage } from "@/components/shop/ListingPage";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Gifts under KES 1,000",
  path: "/gifts-under-1000",
  description: "Thoughtful gift ideas for under KES 1,000 - personalized, gift-ready and priced to not feel like a compromise.",
});

export default async function GiftsUnder1000Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const page = sp.page ? Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1 : 1;
  return (
    <ListingPage
      key="under-1000"
      eyebrow="Easy on the budget"
      title="Gifts under KES 1,000"
      description="Thoughtful is a decision, not a price tag. These gifts stay under KES 1,000, gift-ready and on time."
      filters={{ max: 1000, sort: "price-asc", page }}
      href="/gifts-under-1000"
    />
  );
}