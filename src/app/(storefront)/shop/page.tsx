import { ListingPage } from "@/components/shop/ListingPage";
import { ProductCategoriesCard } from "@/components/shop/ProductCategoriesCard";
import { FeaturedCategoriesCard } from "@/components/shop/FeaturedCategoriesCard";
import { CatalogMenu } from "@/components/shop/CatalogMenu";
import { getDealProducts } from "@/lib/data/products";
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
 const cards = () => (
  <>
    <ProductCategoriesCard />
    <FeaturedCategoriesCard products={deals} />
  </>
 );

 return (
  <ListingPage
    title="Shop All Gifts"
    filters={{ ...filters }}
    href="/shop"
    sidebar={cards()}
    mobileCatalog={<CatalogMenu>{cards()}</CatalogMenu>}
  />
 );
}