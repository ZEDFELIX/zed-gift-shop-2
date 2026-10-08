import "server-only";

import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getWishlistProducts } from "@/lib/wishlist";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
 title: "Your Wishlist",
 path: "/wishlist",
 description: "Products you've saved.",
});

export default async function WishlistPage() {
 const user = await getCurrentUser();
 const products = await getWishlistProducts(user?.id ?? null);

 return (
 <div className="container-zed py-10 lg:py-14">
 <header className="flex flex-wrap items-end justify-between gap-4">
 <div>
 <p className="eyebrow">Saved</p>
 <h1 className="mt-2 font-display text-3xl font-bold text-[#07111F]">Your Wishlist</h1>
 </div>
 {user && (
 <Link href="/account" className="text-sm font-semibold text-deep-olive underline-offset-2 hover:underline">
 Back to account
 </Link>
 )}
 </header>
 <div className="mt-10">
 {products.length === 0 ? (
 <div className="glass-panel rounded-zed border border-dashed border-white/50 px-6 py-20 text-center">
 <p className="font-display text-xl font-bold text-[#07111F]">Nothing saved yet</p>
 <p className="mt-2 text-[#334155]">Tap the heart on any gift to keep it here for later.</p>
 <Link href="/shop" className="mt-6 inline-flex rounded-zed bg-zed-950 px-6 py-3 text-sm font-bold text-white">
 Browse gifts
 </Link>
 </div>
 ) : (
 <ProductGrid products={products} wishlistIds={products.map((p) => p.id)} />
 )}
 </div>
 </div>
 );
}