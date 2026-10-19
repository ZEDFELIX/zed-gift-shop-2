import Link from "next/link";
import { CATEGORY_STRIP } from "@/lib/constants";

/** Sidebar "Product Categories" card, styled like the Rio Gift Shop widget. */
export function ProductCategoriesCard() {
 return (
 <aside className="w-full rounded-2xl bg-[#C24B80] p-5 text-white shadow-sm" aria-label="Product categories">
 <h2 className="font-display text-xl font-bold leading-none">Product Categories</h2>
 <ul className="mt-2">
 {CATEGORY_STRIP.map((c) => (
 <li key={c.href} className="border-b border-dashed border-white/50 last:border-b-0">
 <Link
 href={c.href}
 className="block py-3.5 font-display text-base font-semibold text-white transition-colors hover:text-white/80"
 >
 {c.label}
 </Link>
 </li>
 ))}
 </ul>
 </aside>
 );
}
