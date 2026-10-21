import { Gift, Package, Heart, Users, Truck } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "About Us | ZED Gift Shop", description: "ZED Gift Shop is a Nairobi-based gifting studio making personalized, thoughtfully chosen gifts delivered across Kenya." };

const values = [
  { icon: Heart, title: "Personal, always", body: "Names, engraved messages and custom packaging on request." },
  { icon: Package, title: "Quality you can feel", body: "Premium materials, checked by hand before anything ships." },
  { icon: Truck, title: "On time, every time", body: "Same-day across Nairobi, tracked delivery countrywide." },
  { icon: Users, title: "Rooted in Kenya", body: "Local makers, locally stocked, delivered locally." },
];

const OCCASIONS = ["Birthdays", "Weddings", "Ruracio", "Baby showers", "Graduations", "Eid", "Christmas", "Corporate events"];

export default function AboutPage() {
  return (
    <div>
      <div className="bg-zed-950 py-16 text-white">
        <div className="container-zed">
          <p className="eyebrow text-white">Our story</p>
          <h1 className="mt-2 max-w-2xl font-display text-4xl font-black sm:text-5xl">Gifts that say more.</h1>
          <p className="mt-5 max-w-2xl text-white/75">
            The best gifts in Kenya were hard to find, and the personal ones took weeks. So we built a faster,
            more heartfelt way to give.
          </p>
        </div>
      </div>

      <div className="container-zed py-12 sm:py-14">
        {/* Who we are */}
        <section className="max-w-3xl">
          <h2 className="font-display text-2xl font-bold text-[#07111F]">Who we are</h2>
          <div className="mt-3 space-y-4 leading-relaxed text-[#07111F]">
            <p>
              ZED Gift Shop is a Nairobi-based gifting studio. Every order is picked by hand, wrapped with care and
              personalized to your message - engraved keepsakes, custom mugs, hampers and corporate gift boxes.
            </p>
            <p>
              Same-day delivery in Nairobi and fast, tracked delivery countrywide. One gift or a hundred,
              when the date matters, it lands on time.
            </p>
          </div>
        </section>

        {/* Occasions */}
        <section className="mt-10">
          <h2 className="font-display text-xl font-bold text-[#07111F]">Made for Kenya&apos;s occasions</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {OCCASIONS.map((o) => (
              <li key={o} className="rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-[#07111F] shadow-sm">
                {o}
              </li>
            ))}
          </ul>
        </section>

        {/* Why ZED */}
        <section className="mt-10">
          <h2 className="font-display text-xl font-bold text-[#07111F]">Why shop with ZED</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="glass-card rounded-zed p-5">
                <span className="grid size-11 place-items-center rounded-zed glass-panel text-deep-olive">
                  <v.icon className="size-5" />
                </span>
                <p className="mt-3 font-display font-bold text-[#07111F]">{v.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-[#334155]">{v.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Where to next */}
        <section className="mt-10">
          <ul className="mt-3 grid gap-3 sm:grid-cols-3">
            <li>
              <Link href="/shop" className="block rounded-zed glass-card p-5 transition-colors hover:border-charcoal/20">
                <p className="font-display font-bold text-[#07111F]">Shop the collection</p>
                <p className="mt-1 text-sm text-[#334155]">Ready-to-gift treasures for every occasion.</p>
              </Link>
            </li>
            <li>
              <Link href="/wholesale" className="block rounded-zed glass-card p-5 transition-colors hover:border-charcoal/20">
                <p className="font-display font-bold text-[#07111F]">Wholesale & bulk</p>
                <p className="mt-1 text-sm text-[#334155]">10+ pieces per product qualifies for a discount.</p>
              </Link>
            </li>
            <li>
              <Link href="/cards" className="block rounded-zed glass-card p-5 transition-colors hover:border-charcoal/20">
                <p className="font-display font-bold text-[#07111F]">Greeting cards</p>
                <p className="mt-1 text-sm text-[#334155]">Keepsakes written with your own words.</p>
              </Link>
            </li>
          </ul>
        </section>

        {/* Contact strip */}
        <div className="mt-12 flex flex-col items-center gap-3 rounded-zed bg-zed-950 p-8 text-center text-white sm:flex-row sm:justify-center sm:text-left">
          <div className="flex items-center gap-3">
            <Gift className="size-6 shrink-0 text-white" />
            <p className="text-sm">Need a custom gift? We love a challenge.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
