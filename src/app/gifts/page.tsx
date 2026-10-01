import "server-only";

import Link from "next/link";
import { ArrowRight, Cake, Heart, GraduationCap, Briefcase } from "lucide-react";
import { listGiftPages } from "@/lib/data/catalog";
import { OCCASION_CARDS } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
 title: "Gifts by Occasion & Recipient",
 path: "/gifts",
 description: "Find the perfect gift by occasion (birthday, anniversary, graduation, corporate) or recipient - delivered across Kenya.",
});

export default async function GiftsPage() {
 const giftPages = await listGiftPages();
 const occasions = giftPages.filter((g) => g.kind === "OCCASION");
 const recipients = giftPages.filter((g) => g.kind === "RECIPIENT");

 return (
 <div className="container-zed py-10 lg:py-14">
 <header className="max-w-2xl">
 <p className="eyebrow">Gift discovery</p>
 <h1 className="mt-2 font-display text-3xl font-bold text-[#07111F] lg:text-4xl">What are we celebrating?</h1>
 <p className="mt-3 text-[#07111F]">
 Start with the occasion or the person - we&apos;ll match the moment to the gift.
 </p>
 </header>

 <section className="mt-10">
 <h2 className="font-display text-xl font-bold text-[#07111F]">By occasion</h2>
 <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
 {OCCASION_CARDS.map((c) => (
 <Link key={c.href} href={c.href} className="group relative block aspect-[4/5] overflow-hidden rounded-zed bg-white/45">
 <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url(${c.image})` }} />
 <div className="absolute inset-0 bg-gradient-to-t from-obsidian/75 to-transparent" />
 <span className="absolute inset-x-3 bottom-3 text-center font-display text-sm font-bold text-white">{c.title}</span>
 </Link>
 ))}
 </div>
 </section>

 <section className="mt-12">
 <h2 className="font-display text-xl font-bold text-[#07111F]">By recipient</h2>
 <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
 {recipients.map((r) => (
 <Link
 key={r.id}
 href={`/gifts/${r.slug}`}
 className="glass-card flex flex-col items-center justify-center gap-2 rounded-zed p-6 text-center transition-all hover:-translate-y-1 hover:shadow-glass-lg"
 >
 <span className="font-display text-sm font-bold text-[#07111F]">{r.name}</span>
 <span className="text-xs text-[#334155]">{r._count.products} gifts</span>
 </Link>
 ))}
 </div>
 </section>

 <section className="mt-12 rounded-zed bg-zed-950 p-8 text-white lg:p-10">
 <div className="grid gap-6 lg:grid-cols-2">
 <div>
 <h2 className="font-display text-2xl font-bold">Not sure where to start?</h2>
 <p className="mt-2 max-w-md text-white/75">
 Use the Gift Builder to pick a recipient, budget and vibe - we&apos;ll assemble a ready-to-checkout box of ideas.
 </p>
 <Link
 href="/gift-builder"
 className="mt-6 inline-flex items-center gap-2 rounded-zed bg-zed-950 px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-white"
 >
 Open the Gift Builder <ArrowRight className="size-4" />
 </Link>
 </div>
 </div>
 </section>
 </div>
 );
}