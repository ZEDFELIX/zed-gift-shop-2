import { ListingPage } from "@/components/shop/ListingPage";
import { ProductCategoriesCard } from "@/components/shop/ProductCategoriesCard";
import { FeaturedCategoriesCard } from "@/components/shop/FeaturedCategoriesCard";
import { CustomerReviews } from "@/components/shop/CustomerReviews";
import { GoogleReviews } from "@/components/shop/GoogleReviews";
import { getDealProducts } from "@/lib/data/products";
import { getSetting } from "@/lib/data/settings";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = buildMetadata({
  title: "Shop All Gifts",
  description: "Browse the full ZED GIFT SHOP catalogue - personalized keepsakes, gift boxes, corporate gifts and more, delivered across Kenya.",
  path: "/shop",
});

function boolParam(value: unknown) {
 return value === "1" || value === "true";
}

function safePrice(value: string | undefined): number | undefined {
  if (value == null || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : undefined;
}

function safePage(value: string | undefined): number {
  if (value == null || value.trim() === "") return 1;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1;
}

function parseGoogleReviews(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r): r is Record<string, unknown> => Boolean(r) && typeof r === "object")
    .map((r) => ({
      name: String(r.name ?? "Google Customer").trim(),
      rating: Math.min(5, Math.max(1, Math.round(Number(r.rating ?? 5)))),
      text: String(r.text ?? r.review ?? r.comment ?? "").trim(),
      time: String(r.time ?? r.date ?? ""),
      profilePhotoUrl: String(r.profilePhotoUrl ?? ""),
    }))
    .filter((r) => r.name && r.text);
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
 const sp = await searchParams;
 const get = (k: string) => {
  const v = sp[k];
  return Array.isArray(v) ? v[0] : v;
 };

 const filters = {
  q: get("q")?.trim() ?? "",
  category: get("category") ?? "",
  occasion: get("occasion") ?? "",
  recipient: get("recipient") ?? "",
  collection: get("collection") ?? "",
  min: safePrice(get("min")),
  max: safePrice(get("max")),
  personalized: boolParam(get("personalized")),
  flashSale: boolParam(get("flashSale")),
  deals: boolParam(get("deals")),
  bestSeller: boolParam(get("bestSeller")),
  inStock: boolParam(get("inStock")),
  sort: get("sort") ?? "featured",
  page: safePage(get("page")),
 } as const;

 const deals = await getDealProducts(4);
 const googleRaw = await getSetting("googleReviews");
 const googleReviews = parseGoogleReviews(googleRaw);
 const cards = () => (
  <>
    <ProductCategoriesCard />
    <FeaturedCategoriesCard products={deals} />
  </>
 );

 return (
  <>
    <ListingPage
     title="Shop All Gifts"
     filters={{ ...filters }}
     href="/shop"
     sidebar={cards()}
    />
    <CustomerReviews />
    {googleReviews.length > 0 && <GoogleReviews reviews={googleReviews} />}
  </>
 );
}
