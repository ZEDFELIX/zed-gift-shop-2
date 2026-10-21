import "server-only";

import { Quote, Star } from "lucide-react";
import { getSetting } from "@/lib/data/settings";

export type CustomerReview = {
  name: string;
  location: string;
  rating: number;
  text: string;
};

/** Turns whatever is stored in settings into a clean list of reviews. */
function parseReviews(raw: unknown): CustomerReview[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r): r is Record<string, unknown> => Boolean(r) && typeof r === "object")
    .map((r) => ({
      name: String(r.name ?? "").trim(),
      location: String(r.location ?? "").trim(),
      rating: Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5))),
      text: String(r.text ?? "").trim(),
    }))
    .filter((r) => r.name && r.text);
}

export async function CustomerReviews() {
  const raw = await getSetting("customerReviews");
  const reviews = parseReviews(raw);
  if (!reviews.length) return null;

  return (
    <section className="container-zed mb-10 sm:mb-12" aria-label="Customer reviews">
      <div className="glass-panel rounded-2xl p-3 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-2 border-b-2 border-orange-400 pb-2.5">
          <h2 className="font-display text-lg font-bold sm:text-xl">Customer reviews</h2>
          <p className="text-[11px] font-semibold text-charcoal/50">Verified buyers</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {reviews.map((review, i) => (
            <figure
              key={`${review.name}-${i}`}
              className="flex h-full flex-col rounded-xl border border-white/60 bg-white/80 p-4 shadow-sm"
            >
              <Quote className="size-4 text-rose-400 fill-current" aria-hidden="true" />
              <div className="mt-1.5 flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star
                    key={s}
                    className={`size-3.5 ${s < review.rating ? "fill-current text-amber-400" : "text-charcoal/25"}`}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <blockquote className="mt-2 flex-1 text-[13px] leading-relaxed text-charcoal/80">
                {review.text}
              </blockquote>
              <figcaption className="mt-3 border-t border-edge pt-2 text-[12px] font-bold text-charcoal-950">
                {review.name}
                {review.location ? <span className="block text-[11px] font-medium text-charcoal/50">{review.location}</span> : null}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
