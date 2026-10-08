import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { getProductByIdForAdmin } from "@/lib/data/products";
import { listCategories, listCollections } from "@/lib/data/catalog";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit product | Admin" };

export default async function AdminProductEditPage({ params }: { params: Promise<{ productId: string }> }) {
 const { productId } = await params;
 const [product, categories, collections] = await Promise.all([
 getProductByIdForAdmin(productId),
 listCategories(),
 listCollections(),
 ]);
 if (!product) notFound();

 return (
 <ProductForm
 product={{
 id: product.id,
 name: product.name,
 slug: product.slug,
 headline: product.headline ?? "",
 shortDescription: product.shortDescription ?? "",
 description: product.description ?? "",
 price: product.price,
 compareAtPrice: product.compareAtPrice,
 sku: product.sku ?? "",
 status: product.status,
 featured: product.featured,
 bestSeller: product.bestSeller,
 trackInventory: product.trackInventory,
 quantity: product.quantity,
 lowStockThreshold: product.lowStockThreshold,
 personalizationEnabled: product.personalizationEnabled,
 giftWrapAvailable: product.giftWrapAvailable,
 giftMessageAvailable: product.giftMessageAvailable,
 images: product.images.map((i) => i.url),
 videoUrl: product.videoUrl ?? "",
 categoryIds: product.categories.map((c) => c.categoryId),
 collectionIds: product.collections.map((c) => c.collectionId),
 variants: product.variants.map((v) => ({
 name: v.name, value: v.value, sku: v.sku, priceOffset: v.priceOffset, quantity: v.quantity, active: v.active,
 })),
 }}
 categories={categories.map((c) => ({ id: c.id, name: c.name, kind: c.kind }))}
 collections={collections.map((c) => ({ id: c.id, name: c.name }))}
 />
 );
}