"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import Image from "next/image";

export type GoogleReview = {
  name: string;
  rating: number;
  text: string;
  time?: string;
  profilePhotoUrl?: string;
};

/** Parses Google reviews stored in settings (customerReviews.googleReviews). */
function parseGoogleReviews(raw: unknown): GoogleReview[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r): r is Record<string, unknown> => Boolean(r) && typeof r === "object")
    .map((r) => ({
      name: String(r.name ?? "Google Customer").trim(),
      rating: Math.min(5, Math.max(1, Math.round(Number(r.rating ?? 5)))),
      text: String(r.text ?? r.review ?? r.comment ?? "").trim(),
      time: String(r.time ?? r.date ?? ""),
      profilePhotoUrl: String(r.profilePhotoUrl ?? ""),
    }))
    .filter((r) => r.name && r.text);
}

export function GoogleReviews({ reviews }: { reviews: GoogleReview[] }) {
  const trackRef = React.useRef<HTMLDivElement>(null);

  function scrollBy(dir: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.8), behavior: "smooth" });
  }

  const stars = (rating: number) => (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, s) => (
        <Star
          key={s}
          className={`size-3.5 ${s < rating ? "fill-current text-google-yellow" : "text-gray-300"}`}
          aria-hidden="true"
        />
      ))}
    </div>
  );

  return (
    <section className="container-zed mb-8 sm:mb-10" aria-label="Google reviews">
      <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-0.5">
              <span className="h-1 w-4 rounded-full bg-blue-600" />
              <span className="h-1 w-4 rounded-full bg-red-600" />
              <span className="h-1 w-4 rounded-full bg-yellow-500" />
              <span className="h-1 w-4 rounded-full bg-green-600" />
            </span>
            <h2 className="font-display text-lg font-bold sm:text-xl text-gray-900">
              Google Reviews
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Previous reviews"
              className="grid size-8 place-items-center rounded-md border border-gray-200 text-gray-700 transition-colors hover:border-rose-300 hover:text-rose-600"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Next reviews"
              className="grid size-8 place-items-center rounded-md border border-gray-200 text-gray-700 transition-colors hover:border-rose-300 hover:text-rose-600"
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
              className="flex w-[82vw] min-w-[82vw] shrink-0 snap-start flex-col rounded-lg border border-gray-200 bg-white p-4 sm:w-[320px] sm:min-w-[320px]"
            >
              <div className="flex items-start gap-1.5">
                {review.profilePhotoUrl ? (
                  <Image
                    src={review.profilePhotoUrl}
                    alt={review.name}
                    width={32}
                    height={32}
                    sizes="32px"
                    unoptimized
                    className="size-8 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="size-8 shrink-0 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 font-medium text-sm">
                    {review.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-bold text-gray-900">{review.name}</span>
                    <span className="text-[10px] text-gray-400">Google</span>
                  </div>
                  {stars(review.rating)}
                  {review.time && (
                    <p className="mt-0.5 text-[10px] text-gray-400">{review.time}</p>
                  )}
                </div>
              </div>
              <blockquote className="mt-2.5 flex-1 text-[13px] leading-relaxed text-gray-800">
                {review.text}
              </blockquote>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
