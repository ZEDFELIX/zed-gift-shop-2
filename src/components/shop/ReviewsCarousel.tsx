"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, Plus, Quote, Star } from "lucide-react";
import type { CustomerReview } from "@/components/shop/CustomerReviews";

export function ReviewsCarousel({ reviews, addHref }: { reviews: CustomerReview[]; addHref: string }) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollBy(dir: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.8), behavior: "smooth" });
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-2 border-b-2 border-orange-400 pb-2.5">
        <h2 className="font-display text-lg font-bold sm:text-xl">Customer reviews</h2>
        <div className="flex items-center gap-2">
          <a
            href={addHref}
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-1 rounded-md bg-rose-500 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm transition-colors hover:bg-rose-600"
          >
            <Plus className="size-3.5" /> Add review
          </a>
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Previous reviews"
            className="grid size-8 place-items-center rounded-md border border-edge text-charcoal/70 transition-colors hover:border-rose-300 hover:text-rose-600"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Next reviews"
            className="grid size-8 place-items-center rounded-md border border-edge text-charcoal/70 transition-colors hover:border-rose-300 hover:text-rose-600"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-1 scrollbar-none"
      >
        {reviews.map((review, i) => (
          <figure
            key={`${review.name}-${i}`}
            className="flex w-[80vw] min-w-[80vw] shrink-0 snap-start flex-col rounded-xl border border-white/60 bg-white/80 p-4 shadow-sm sm:w-[300px] sm:min-w-[300px]"
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
    </>
  );
}
