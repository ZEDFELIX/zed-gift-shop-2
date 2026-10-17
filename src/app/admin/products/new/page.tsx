import { ProductForm } from "@/components/admin/ProductForm";
import { listCategories, listCollections } from "@/lib/data/catalog";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "New product | Admin" };

export default async function AdminProductNewPage() {
 const [categories, collections, me] = await Promise.all([listCategories(), listCollections(), getCurrentUser().catch(() => null)]);
 const showStock = me?.role === "ADMIN";
 return (
 <ProductForm
 categories={categories.map((c) => ({ id: c.id, name: c.name, kind: c.kind }))}
 collections={collections.map((c) => ({ id: c.id, name: c.name }))}
 showStock={showStock}
 />
 );
}