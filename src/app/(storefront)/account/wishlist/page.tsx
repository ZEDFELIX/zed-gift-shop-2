import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatKES } from "@/lib/utils";
import { WishlistRemoveButton } from "@/components/account/WishlistRemoveButton";
import { ClearWishlistButton, WishlistCartButton } from "@/components/account/WishlistActions";

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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#542447]">Your personal collection</p>
          <h2 className="mt-1 font-display text-xl font-bold text-[#171717] sm:text-2xl">Saved gifts</h2>
          <p className="mt-1 text-sm text-[#334155]">{items.length} saved {items.length === 1 ? "gift" : "gifts"} — ready whenever you are.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ClearWishlistButton count={items.length} />
          <Link href="/shop" className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#542447] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#3f1b35]">Discover more gifts</Link>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
        {items.map(({ product }) => {
          const image = product.images[0];
          const inStock = !product.trackInventory || product.quantity > product.reservedQuantity;
          return (
            <article key={product.id} className="zed-product-card flex min-w-0 flex-col overflow-hidden rounded-lg">
              <Link href={`/product/${product.slug}`} className="relative block aspect-square bg-white">
                {image?.url ? <Image src={image.url} alt={image.alt ?? product.name} fill sizes="(min-width:1280px) 220px, 45vw" className="object-contain" /> : <span className="grid h-full place-items-center text-sm text-charcoal/50">ZED</span>}
              </Link>
              <div className="flex flex-1 flex-col p-3">
                <Link href={`/product/${product.slug}`} className="line-clamp-2 min-h-10 text-sm font-semibold text-[#171717] hover:text-[#542447]">{product.name}</Link>
                <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <p className="font-bold text-[#171717]">{formatKES(product.price)}</p>
                  {product.compareAtPrice != null && product.compareAtPrice > product.price ? <p className="text-xs text-charcoal/45 line-through">{formatKES(product.compareAtPrice)}</p> : null}
                </div>
                <p className={`mt-1 flex items-center gap-1.5 text-xs ${inStock ? "text-emerald-700" : "text-rose-600"}`}><span className={`size-1.5 rounded-full ${inStock ? "bg-emerald-500" : "bg-rose-500"}`} />{inStock ? "In stock" : "Currently out of stock"}</p>
                <div className="mt-auto flex flex-col gap-2 pt-3">
                  <WishlistCartButton productId={product.id} inStock={inStock} />
                  <WishlistRemoveButton productId={product.id} />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
