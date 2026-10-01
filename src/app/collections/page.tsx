import "server-only";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { listCollections } from "@/lib/data/catalog";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
 title: "Collections",
 path: "/collections",
 description: "Curated ZED GIFT SHOP collections - bestsellers, personalized picks, corporate gifts and more.",
});

export default async function CollectionsPage() {
 const collections = await listCollections();
 return (
 <div className="container-zed py-10 lg:py-14">
 <header className="max-w-2xl">
 <p className="eyebrow">Curated for you</p>
 <h1 className="mt-2 font-display text-3xl font-bold text-[#07111F] lg:text-4xl">Collections</h1>
 <p className="mt-3 text-[#07111F]">Groups of gifts we&apos;ve put together for how you shop.</p>
 </header>

 <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
 {collections.map((c) => (
 <Link key={c.id} href={`/collections/${c.slug}`} className="group overflow-hidden rounded-zed glass-panel">
 <div className="relative aspect-[4/3] overflow-hidden">
 <div
 className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
 style={{ backgroundImage: `url(${c.image ?? "/placeholders/collection-bestsellers.svg"})` }}
 />
 <div className="absolute inset-0 bg-gradient-to-t from-obsidian/70 via-transparent to-transparent" />
 <div className="absolute inset-x-5 bottom-5">
 <p className="font-display text-xl font-bold text-white">{c.name}</p>
 <p className="mt-1 text-sm text-white/70">{c._count.products} gifts</p>
 <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-white">
 Shop collection <ArrowRight className="size-4" />
 </span>
 </div>
 </div>
 </Link>
 ))}
 </div>
 </div>
 );
}