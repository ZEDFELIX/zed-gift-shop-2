import Link from "next/link";
import { FEATURED_CATEGORIES } from "@/lib/constants";

/** Visual category shortcuts, in the spirit of Rio Gift Shop's category widget. */
export function FeaturedCategories() {
 return (
 <section className="mb-9 sm:mb-11" aria-label="Featured categories">
 <div className="mb-3 flex items-center justify-between gap-2">
 <h2 className="font-display text-lg font-bold text-[var(--color-ink)] sm:text-xl">Featured Categories</h2>
 <Link
 href="/shop"
 className="shrink-0 rounded-md bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-600 transition-colors hover:bg-orange-100"
 >
 Shop all <span aria-hidden="true">›</span>
 </Link>
 </div>
 <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
 {FEATURED_CATEGORIES.map((c) => (
 <Link
 key={`${c.href}-${c.title}`}
 href={c.href}
 className="group relative block overflow-hidden rounded-2xl bg-black/5"
 >
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img
 src={c.image}
 alt={c.title}
 loading="lazy"
 className="aspect-[4/5] w-full object-cover transition-transform duration-300 group-hover:scale-105"
 />
 <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" aria-hidden="true" />
 <span className="absolute inset-x-0 bottom-0 p-3 font-display text-sm font-bold leading-tight text-white sm:text-base">
 {c.title}
 </span>
 </Link>
 ))}
 </div>
 </section>
 );
}
