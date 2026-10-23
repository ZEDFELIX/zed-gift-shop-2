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
  min: get("min") ? Number(get("min")) : undefined,
  max: get("max") ? Number(get("max")) : undefined,
  personalized: boolParam(get("personalized")),
  flashSale: boolParam(get("flashSale")),
  deals: boolParam(get("deals")),
  bestSeller: boolParam(get("bestSeller")),
  inStock: boolParam(get("inStock")),
  sort: get("sort") ?? "featured",
  page: get("page") ? Number(get("page")) : 1,
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