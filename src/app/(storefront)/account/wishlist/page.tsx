import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatKES } from "@/lib/utils";
import { WishlistRemoveButton } from "@/components/account/WishlistRemoveButton";

export const metadata = { title: "Saved gifts" };
export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const user = (await getCurrentUser())!;
  const wishlist = await prisma.wishlist.findUnique({
    where: { userId: user.id },
    include: {
      items: {
        orderBy: { createdAt: "desc" },
        include: {
          product: {
            select: {
              id: true, slug: true, name: true, price: true, compareAtPrice: true,
              status: true, quantity: true, reservedQuantity: true, trackInventory: true,
              images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, alt: true } },
            },
          },
        },
      },
    },
  });
  const items = (wishlist?.items ?? []).filter((item) => item.product.status === "ACTIVE");

  if (!items.length) return (
    <section className="glass-card rounded-zed p-8 text-center sm:p-12">
      <h2 className="font-display text-xl font-bold text-[#07111F]">Your saved gifts will appear here</h2>
      <p className="mt-2 text-sm text-[#334155]">Tap the heart on a gift to keep it handy for later.</p>
      <Link href="/shop" className="mt-5 inline-flex rounded-zed bg-zed-950 px-5 py-3 text-sm font-bold text-white">Explore gifts</Link>
    </section>
  );

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div><h2 className="font-display text-xl font-bold text-[#07111F]">Saved gifts</h2><p className="text-sm text-[#334155]">{items.length} item{items.length === 1 ? "" : "s"}</p></div>
        <Link href="/shop" className="text-sm font-semibold text-zed-700 hover:underline">Continue shopping</Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {items.map(({ product }) => {
          const image = product.images[0];
          const inStock = !product.trackInventory || product.quantity > product.reservedQuantity;
          return (
            <article key={product.id} className="zed-product-card flex min-w-0 flex-col overflow-hidden rounded-lg">
              <Link href={`/product/${product.slug}`} className="relative block aspect-square bg-white">
                {image?.url ? <Image src={image.url} alt={image.alt ?? product.name} fill sizes="(min-width:1280px) 220px, 45vw" className="object-contain" /> : <span className="grid h-full place-items-center text-sm text-charcoal/50">ZED</span>}
              </Link>
              <div className="flex flex-1 flex-col p-3">
                <Link href={`/product/${product.slug}`} className="line-clamp-2 min-h-10 text-sm font-semibold text-[#07111F] hover:text-zed-700">{product.name}</Link>
                <p className="mt-1 font-bold text-[#07111F]">{formatKES(product.price)}</p>
                <p className={`mt-1 text-xs ${inStock ? "text-emerald-700" : "text-rose-600"}`}>{inStock ? "In stock" : "Currently out of stock"}</p>
                <div className="mt-auto pt-3"><WishlistRemoveButton productId={product.id} /></div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
