import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ page, pages, total, pageSize, href }: { page: number; pages: number; total: number; pageSize: number; href: string }) {
 if (pages <= 1) return null;
 const start = (page - 1) * pageSize + 1;
 const end = Math.min(page * pageSize, total);

 function pageHref(p: number) {
 return `${href}${href.includes("?") ? "&" : "?"}page=${p}`;
 }

 return (
 <div className="mt-10 flex flex-col items-center gap-3">
 <div className="flex items-center gap-1.5">
 <Link
 href={pageHref(page - 1)}
 aria-disabled={page <= 1}
 aria-label="Previous page"
 className={`glass-panel grid size-10 place-items-center rounded-zed ${page <= 1 ? "pointer-events-none opacity-40" : "hover:border-soft-sage"}`}
 >
 <ChevronLeft className="size-4" />
 </Link>
 {Array.from({ length: pages }, (_, i) => i + 1)
 .filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1)
 .reduce<(number | "...")[]>((acc, p, idx, arr) => {
 if (idx > 0 && (arr[idx - 1] as number) + 1 !== p) acc.push("...");
 acc.push(p);
 return acc;
 }, [])
 .map((p, i) =>
 p === "..." ? (
 <span key={`gap-${i}`} className="px-2 text-[#6B6B6B]">
 ...
 </span>
 ) : (
 <Link
 key={p}
 href={pageHref(p)}
 aria-current={p === page ? "page" : undefined}
 className={`grid size-10 place-items-center rounded-zed text-sm font-semibold ${
 p === page ? "bg-zed-950 text-white" : "glass-panel text-[#171717] hover:border-soft-sage"
 }`}
 >
 {p}
 </Link>
 ),
 )}
 <Link
 href={pageHref(page + 1)}
 aria-disabled={page >= pages}
 aria-label="Next page"
 className={`glass-panel grid size-10 place-items-center rounded-zed ${page >= pages ? "pointer-events-none opacity-40" : "hover:border-soft-sage"}`}
 >
 <ChevronRight className="size-4" />
 </Link>
 </div>
 <p className="text-xs text-[#6B6B6B]">
 Showing {start}-{end} of {total} gifts
 </p>
 </div>
 );
}