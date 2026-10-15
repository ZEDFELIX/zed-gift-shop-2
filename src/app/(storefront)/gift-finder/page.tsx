import "server-only";

import { prisma } from "@/lib/prisma";
import { listProducts } from "@/lib/data/products";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
 title: "Smart Gift Finder",
 path: "/gift-finder",
 description: "Find the perfect gift with our guided finder.",
});

export default async function GiftFinderPage({
 searchParams,
}: {
 searchParams: Promise<{ q?: string; budget?: string; recipient?: string; occasion?: string }>;
}) {
 const sp = await searchParams;
 const filters: Record<string, string | undefined> = {};
 if (sp.q) filters.q = sp.q;
 if (sp.budget) {
 const max = Number(sp.budget);
 if (!isNaN(max)) filters.max = String(max);
 }
 if (sp.recipient) filters.recipient = sp.recipient;
 if (sp.occasion) filters.occasion = sp.occasion;

 const result = await listProducts(filters as Record<string, string | undefined>);

 return (
 <div className="container-zed py-10 lg:py-14">
 <header className="mb-8">
 <p className="eyebrow">Smart Gift Finder</p>
 <h1 className="mt-2 font-display text-3xl font-bold text-[#07111F] lg:text-4xl">
 {sp.q ? `Results for "${sp.q}"` : "Find the perfect gift"}
 </h1>
 <p className="mt-2 text-sm text-[#334155]">
 {result.total} gift{result.total !== 1 ? "s" : ""} found.
 {sp.q ? " Refined for you." : " Answer a few questions to get started."}
 </p>
 </header>

 <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
 {/* Filters sidebar */}
 <aside className="space-y-4">
 <div className="glass-card rounded-zed p-5">
 <p className="font-display text-sm font-bold text-[#07111F]">Filter by budget</p>
 <div className="mt-3 space-y-2">
 {[
 { label: "Under KES 1,000", max: "1000" },
 { label: "Under KES 2,500", max: "2500" },
 { label: "Under KES 5,000", max: "5000" },
 { label: "Under KES 10,000", max: "10000" },
 ].map((b) => (
 <a
 key={b.max}
 href={`/gift-finder?budget=${b.max}`}
 className="block rounded-lg px-3 py-2 text-sm text-[#07111F] hover:bg-zed-950/5 hover:text-[#07111F]"
 >
 {b.label}
 </a>
 ))}
 </div>
 </div>
 <div className="glass-card rounded-zed p-5">
 <p className="font-display text-sm font-bold text-[#07111F]">Filter by recipient</p>
 <div className="mt-3 space-y-2">
 {["for-him", "for-her", "for-couples", "for-friends", "for-parents", "for-colleagues"].map((r) => (
 <a
 key={r}
 href={`/gift-finder?recipient=${r}`}
 className="block rounded-lg px-3 py-2 text-sm text-[#07111F] hover:bg-zed-950/5 hover:text-[#07111F] capitalize"
 >
 {r.replace("-", " ")}
 </a>
 ))}
 </div>
 </div>
 </aside>

 {/* Results */}
 <ProductGrid products={result.items} />
 </div>
 </div>
 );
}
