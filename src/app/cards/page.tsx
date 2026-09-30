import "server-only";

import Link from "next/link";
import { ArrowRight, Flower2, MessageSquareHeart, Stamp } from "lucide-react";
import { getProductBySlug } from "@/lib/data/products";
import { buildMetadata } from "@/lib/seo";
import { ProductCard } from "@/components/product/ProductCard";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Cards & Keepsakes",
  path: "/cards",
  description: "Cards that keep growing - plantable seed cards, keepsake photo cards and a personal message on every parcel.",
});

export default async function CardsPage() {
  const cards = (
    await Promise.all(["plantable-seed-card-set", "graduation-memory-keepsake", "leather-card-holder"].map((slug) => getProductBySlug(slug)))
  ).filter((p) => p !== null);

  return (
    <div className="container-zed py-10 lg:py-14">
      <header className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">Cards &amp; keepsakes</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-[#171717] lg:text-4xl">The message, made into the gift</h1>
        <p className="mt-3 leading-relaxed text-[#171717]">
          A gift is a message with a delivery date. Add one that keeps blooming - or arrives handwritten - and the moment
          lands twice.
        </p>
      </header>

      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="glass-card rounded-zed p-6">
          <span className="grid size-11 place-items-center rounded-zed glass-panel text-deep-olive"><Flower2 className="size-5" /></span>
          <h2 className="mt-4 font-display text-base font-bold text-[#171717]">Cards that grow</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-[#6B6B6B]">
            Plantable seed cards sprout native wildflowers after the occasion passes. A card that keeps saying it.
          </p>
        </div>
        <div className="glass-card rounded-zed p-6">
          <span className="grid size-11 place-items-center rounded-zed glass-panel text-deep-olive"><Stamp className="size-5" /></span>
          <h2 className="mt-4 font-display text-base font-bold text-[#171717]">Keepsake cards</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-[#6B6B6B]">
            Framed photo cards and printed keepsakes that hold the memory long after the wrapping is gone.
          </p>
        </div>
        <div className="glass-card rounded-zed p-6">
          <span className="grid size-11 place-items-center rounded-zed glass-panel text-deep-olive"><MessageSquareHeart className="size-5" /></span>
          <h2 className="mt-4 font-display text-base font-bold text-[#171717]">Messages at checkout</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-[#6B6B6B]">
            Every order can carry a handwritten-style note from you, tucked in with the gift.
          </p>
        </div>
      </section>

      {cards.length > 0 && (
        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-bold text-[#171717] lg:text-3xl">From the shelf</h2>
            <Link href="/shop" className="hidden shrink-0 items-center gap-1.5 text-sm font-bold text-deep-olive transition-colors hover:text-zed-900 sm:flex">
              Shop all gifts <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
            {cards.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-10 rounded-zed bg-zed-950 px-7 py-10 text-center text-white">
        <h2 className="font-display text-2xl font-bold">The borrowed phrase problem</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-white/70">
          Ready-to-sign cards make you borrow happy birthday or well done from a stranger. A seed card, a printed photo or a
          note in your own words makes it yours.
        </p>
        <Link href="/personalized" className="mt-6 inline-flex items-center gap-1.5 rounded-zed bg-white px-6 py-3 text-sm font-bold text-[#171717] transition-colors hover:bg-gold">
          Personalize a gift <ArrowRight className="size-4" />
        </Link>
      </section>
    </div>
  );
}