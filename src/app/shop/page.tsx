import { ListingPage } from "@/components/shop/ListingPage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Shop All Gifts", description: "Browse the full ZED GIFT SHOP catalogue - personalized keepsakes, gift boxes, corporate gifts and more, delivered across Kenya." };

function boolParam(value: unknown) {
 return value === "1" || value === "true";
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
  inStock: boolParam(get("inStock")),
  sort: get("sort") ?? "featured",
  page: get("page") ? Number(get("page")) : 1,
 } as const;

 return (
  <ListingPage
   title="Shop All Gifts"
   filters={{ ...filters }}
   href="/shop"
  />
 );
}