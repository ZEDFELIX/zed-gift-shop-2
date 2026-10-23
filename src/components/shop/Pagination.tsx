import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  pages,
  total,
  pageSize,
  href,
  query = "",
}: {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  href: string;
  query?: string;
}) {
  if (pages <= 1) return null;
  const safePage = Math.min(pages, Math.max(1, Number.isFinite(page) ? Math.trunc(page) : 1));
  const start = (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, total);

  function pageHref(p: number) {
    const params = new URLSearchParams(query);
    params.set("page", String(Math.min(pages, Math.max(1, p))));
    return `${href}?${params.toString()}`;
  }

  return (
    <nav aria-label="Product pages" className="mt-10 flex flex-col items-center gap-3">
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <Link
          href={pageHref(safePage - 1)}
          aria-disabled={safePage <= 1}
          aria-label="Previous page"
          tabIndex={safePage <= 1 ? -1 : undefined}
          className={`glass-panel grid size-11 place-items-center rounded-zed ${safePage <= 1 ? "pointer-events-none opacity-40" : "hover:border-soft-sage"}`}
        >
          <ChevronLeft className="size-4" />
        </Link>
        {Array.from({ length: pages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === pages || Math.abs(p - safePage) <= 1)
          .reduce<(number | "...")[]>((acc, p, idx, arr) => {
            if (idx > 0 && (arr[idx - 1] as number) + 1 !== p) acc.push("...");
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === "..." ? (
              <span key={`gap-${i}`} className="px-2 text-[#334155]" aria-hidden="true">
                ...
              </span>
            ) : (
              <Link
                key={p}
                href={pageHref(p)}
                aria-current={p === safePage ? "page" : undefined}
                aria-label={`Page ${p}`}
                className={`grid size-11 place-items-center rounded-zed text-sm font-semibold ${
                  p === safePage ? "bg-zed-950 text-white" : "glass-panel text-[#07111F] hover:border-soft-sage"
                }`}
              >
                {p}
              </Link>
            ),
          )}
        <Link
          href={pageHref(safePage + 1)}
          aria-disabled={safePage >= pages}
          aria-label="Next page"
          tabIndex={safePage >= pages ? -1 : undefined}
          className={`glass-panel grid size-11 place-items-center rounded-zed ${safePage >= pages ? "pointer-events-none opacity-40" : "hover:border-soft-sage"}`}
        >
          <ChevronRight className="size-4" />
        </Link>
      </div>
      <p className="text-xs text-[#334155]">
        Showing {start}-{end} of {total} gifts
      </p>
    </nav>
  );
}
