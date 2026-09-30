import "server-only";

import Link from "next/link";
import { ArrowRight, BadgeCheck, Package, Tag, Truck } from "lucide-react";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Wholesale & Bulk Gifting",
  path: "/wholesale",
  description: "Bulk gifting, client hampers and branded merchandise - consistent, on-brand and on time. Quotes and catalogue access for wholesale buyers.",
});

const REPEATS = [
  { title: "Client appreciation", copy: "Seasonal hampers, milestone gifts and thank-you packages that stay on-brand." },
  { title: "Staff recognition", copy: "Employee awards, onboarding kits and work-iversary keepsakes at headcount scale." },
  { title: "Event gifting", copy: "Conference bags, seminar packs and guest gifts, delivered to your venue or door." },
  { title: "Partnership & press", copy: "Small-batch branded sets for partners, influencers and the people who grow the business." },
] as const;

const STEPS = [
  { title: "Tell us the scope", copy: "Quantity, budget per gift, brand and dates. A rough idea is fine to start." },
  { title: "We propose a set", copy: "Curated options within budget, with personalization and packaging accounted for." },
  { title: "Approve and brand", copy: "Print, engrave or emboss your logo. Sample first if you need to see it." },
  { title: "Deliver and track", copy: "Bulk to one drop point or individually by courier - with tracking either way." },
] as const;

export default function WholesalePage() {
  return (
    <div className="container-zed py-10 lg:py-14">
      <header className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">Wholesale &amp; bulk</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-[#171717] lg:text-4xl">Gifting at scale, without the guesswork</h1>
        <p className="mt-3 leading-relaxed text-[#171717]">
          Consistent, on-brand and on time - that is the bar for bulk orders, from a 20-piece staff run to a 200-piece client
          hamper programme.
        </p>
      </header>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {REPEATS.map((r) => (
          <div key={r.title} className="glass-card rounded-zed p-6">
            <h2 className="font-display text-base font-bold text-[#171717]">{r.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[#6B6B6B]">{r.copy}</p>
          </div>
        ))}
      </section>

      <section className="mt-12 grid items-center gap-8 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <p className="eyebrow">How it works</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-[#171717] lg:text-3xl">Four steps from brief to doorstep</h2>
          <ul className="mt-6 space-y-5">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full glass-panel font-display text-sm font-bold text-deep-olive">
                  {i + 1}
                </span>
                <div>
                  <p className="font-display font-bold text-[#171717]">{s.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-[#6B6B6B]">{s.copy}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contact" className="inline-flex items-center gap-1.5 rounded-zed bg-deep-olive px-6 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-glass transition-colors hover:bg-zed-900">
              Request a quote <ArrowRight className="size-4" />
            </Link>
            <Link href="/gifts/corporate" className="inline-flex items-center gap-1.5 rounded-zed glass-panel px-6 py-3 text-sm font-bold text-[#171717] transition-colors hover:text-deep-olive">
              Browse corporate gifts
            </Link>
          </div>
        </div>
        <div className="grid gap-4">
          <div className="glass-card flex gap-4 rounded-zed p-6">
            <span className="grid size-11 shrink-0 place-items-center rounded-zed glass-panel text-deep-olive"><BadgeCheck className="size-5" /></span>
            <div>
              <h3 className="font-display font-bold text-[#171717]">Branding that holds up</h3>
              <p className="mt-1 text-sm leading-relaxed text-[#6B6B6B]">
                Notebooks, drinkware, desk organizers and totes take print, engraving or embossing well. One hero product and
                one colour reads as a collection, not a mixed bag.
              </p>
            </div>
          </div>
          <div className="glass-card flex gap-4 rounded-zed p-6">
            <span className="grid size-11 shrink-0 place-items-center rounded-zed glass-panel text-deep-olive"><Package className="size-5" /></span>
            <div>
              <h3 className="font-display font-bold text-[#171717]">Volume-friendly</h3>
              <p className="mt-1 text-sm leading-relaxed text-[#6B6B6B]">
                Tiered pricing across the catalogue, gift-ready packaging on every unit and receipts that make finance happy.
              </p>
            </div>
          </div>
          <div className="glass-card flex gap-4 rounded-zed p-6">
            <span className="grid size-11 shrink-0 place-items-center rounded-zed glass-panel text-deep-olive"><Truck className="size-5" /></span>
            <div>
              <h3 className="font-display font-bold text-[#171717]">Delivery that flexes</h3>
              <p className="mt-1 text-sm leading-relaxed text-[#6B6B6B]">
                Bulk to one drop point or individually by courier, county-wide, with tracking for every parcel.
              </p>
            </div>
          </div>
          <div className="glass-card flex gap-4 rounded-zed p-6">
            <span className="grid size-11 shrink-0 place-items-center rounded-zed glass-panel text-deep-olive"><Tag className="size-5" /></span>
            <div>
              <h3 className="font-display font-bold text-[#171717]">One champion to talk to</h3>
              <p className="mt-1 text-sm leading-relaxed text-[#6B6B6B]">
                A dedicated point of contact from brief to delivery - no call queues, no hand-offs.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}