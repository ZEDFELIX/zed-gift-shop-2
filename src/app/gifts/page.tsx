import "server-only";

import Link from "next/link";
import { listGiftPages } from "@/lib/data/catalog";
import { OCCASION_CARDS } from "@/lib/constants";
import { TRUST_POINTS } from "@/lib/constants";
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
  <div className="container-zed py-14 lg:py-20">
   <header className="max-w-3xl mx-auto mb-8">
    <p className="eyebrow text-rose-500">Gift discovery</p>
    <h1 className="mt-2 font-display text-4xl lg:text-5xl font-bold text-charcoal lg:leading-tight">
     Gifts That Mean More.
    </h1>
    <p className="mt-3 text-lg text-charcoal/70 lg:text-base leading-relaxed">
     Thoughtfully curated gifts for every special moment, delivered across Kenya.
    </p>
   </header>

   {/* Trust Bar - using existing TRUST_POINTS */}
   <section className="mt-6 md:mt-8">
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
     {TRUST_POINTS.map((point, i) => (
      <div
       key={i}
       className="glass-panel p-3 md:p-2 rounded-xl text-center text-sm border border-charcoal/10"
       style={{ background: i % 2 === 0 ? "rgba(251, 207, 232, 0.3)" : "rgba(236, 207, 220, 0.3)" }}
      >
       <div className="font-display font-bold text-rose-600">{i + 1}</div>
       <p className="mt-1 text-charcoal/60 line-clamp-2">
        {point.body}
       </p>
      </div>
     ))}
    </div>
   </section>

   {/* Shop by Occasion */}
   <section className="mt-8">
    <h2 className="font-display text-2xl lg:text-3xl font-bold text-charcoal mb-4">Shop by Occasion</h2>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
     {OCCASION_CARDS.map((c) => (
      <Link
       key={c.title}
       href={c.href}
       className="glass-card aspect-[4/5] overflow-hidden rounded-xl transition-transform hover:scale-105 group"
       style={{ backgroundImage: `url(${c.image})` }}
      >
       <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-charcoal/70"></span>
       <span className="absolute inset-x-3 bottom-3 text-center font-display text-xs font-bold text-white">{c.title}</span>
      </Link>
     ))}
    </div>
   </section>

   {/* Shop by Category */}
   <section className="mt-10">
    <h2 className="font-display text-2xl lg:text-3xl font-bold text-charcoal mb-4">Shop by Category</h2>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
     {/* Category cards with placeholder images */}
     <div className="glass-card rounded-xl p-4 flex flex-col justify-center border border-charcoal/10 hover:border-charcoal/20 transition-colors">
      <div className="w-12 h-12 rounded-xl mb-3 bg-rose-100 flex items-center justify-center mx-auto">
       <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
       </svg>
      </div>
      <h3 className="text-center text-sm font-medium text-charcoal">Gift Hampers</h3>
     </div>
     <div className="glass-card rounded-xl p-4 flex flex-col justify-center border border-charcoal/10 hover:border-charcoal/20 transition-colors">
      <div className="w-12 h-12 rounded-xl mb-3 bg-rose-100 flex items-center justify-center mx-auto">
       <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
       </svg>
      </div>
      <h3 className="text-center text-sm font-medium text-charcoal">Flowers</h3>
     </div>
     <div className="glass-card rounded-xl p-4 flex flex-col justify-center border border-charcoal/10 hover:border-charcoal/20 transition-colors">
      <div className="w-12 h-12 rounded-xl mb-3 bg-rose-100 flex items-center justify-center mx-auto">
       <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
       </svg>
      </div>
      <h3 className="text-center text-sm font-medium text-charcoal">Chocolates</h3>
     </div>
     <div className="glass-card rounded-xl p-4 flex flex-col justify-center border border-charcoal/10 hover:border-charcoal/20 transition-colors">
      <div className="w-12 h-12 rounded-xl mb-3 bg-rose-100 flex items-center justify-center mx-auto">
       <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
       </svg>
      </div>
      <h3 className="text-center text-sm font-medium text-charcoal">Teddy Bears</h3>
     </div>
     <div className="glass-card rounded-xl p-4 flex flex-col justify-center border border-charcoal/10 hover:border-charcoal/20 transition-colors">
      <div className="w-12 h-12 rounded-xl mb-3 bg-rose-100 flex items-center justify-center mx-auto">
       <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
       </svg>
      </div>
      <h3 className="text-center text-sm font-medium text-charcoal">Personalised</h3>
     </div>
     <div className="glass-card rounded-xl p-4 flex flex-col justify-center border border-charcoal/10 hover:border-charcoal/20 transition-colors">
      <div className="w-12 h-12 rounded-xl mb-3 bg-rose-100 flex items-center justify-center mx-auto">
       <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
       </svg>
      </div>
      <h3 className="text-center text-sm font-medium text-charcoal">Beauty</h3>
     </div>
     <div className="glass-card rounded-xl p-4 flex flex-col justify-center border border-charcoal/10 hover:border-charcoal/20 transition-colors">
      <div className="w-12 h-12 rounded-xl mb-3 bg-rose-100 flex items-center justify-center mx-auto">
       <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
       </svg>
      </div>
      <h3 className="text-center text-sm font-medium text-charcoal">Home & Lifestyle</h3>
     </div>
    </div>
   </section>
  </div>
 );
}