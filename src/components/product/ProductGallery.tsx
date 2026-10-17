"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";

type GalleryImage = { url: string; alt?: string | null };

/**
 * Jumia-style product gallery: one hero image at a time, swipeable with
 * dots + arrows when the product has several *different* photos, tap to zoom.
 * Duplicate URLs collapse to a single image (no repeated thumbnails).
 */
export function ProductGallery({
  images,
  name,
  sale,
}: {
  images: GalleryImage[];
  name: string;
  sale?: number | null;
}) {
  const seen = new Set<string>();
  const uniq = images.filter((img) => {
    if (!img.url || seen.has(img.url)) return false;
    seen.add(img.url);
    return true;
  });
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const count = uniq.length;

  const go = useCallback(
    (dir: 1 | -1) => {
      const el = trackRef.current;
      if (!el || count < 2) return;
      const next = (index + dir + count) % count;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    },
    [index, count],
  );

  function onScroll() {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) {
      setIndex(Math.max(0, Math.min(count - 1, i)));
      setZoomed(false);
    }
  }

  if (count === 0) {
    return (
      <div className="relative left-1/2 aspect-square w-screen -translate-x-1/2 overflow-hidden bg-white sm:left-auto sm:w-auto sm:translate-x-0 sm:rounded-zed sm:bg-white/45">
        <span className="grid aspect-square place-items-center font-display text-4xl text-soft-sage">ZED</span>
      </div>
    );
  }

  return (
    <div className="relative left-1/2 aspect-square w-screen -translate-x-1/2 bg-white sm:left-auto sm:w-auto sm:translate-x-0 sm:rounded-zed sm:bg-white/45">
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scrollbar-none"
      >
        {uniq.map((img, i) => (
          <div key={`${img.url}-${i}`} className="relative h-full w-full min-w-full snap-center select-none">
            <Image
              src={img.url}
              alt={img.alt ?? name}
              fill
              sizes="(min-width:1024px) 50vw, 100vw"
              unoptimized
              priority={i === 0}
              draggable={false}
              onClick={() => setZoomed((z) => !z)}
              title={zoomed ? "Tap to zoom out" : "Tap to zoom in"}
              className={`object-contain transition-transform duration-300 ${
                zoomed ? "scale-[1.8] cursor-zoom-out" : "cursor-zoom-in"
              }`}
            />
          </div>
        ))}
      </div>

      {sale != null && sale > 0 && (
        <span className="absolute left-4 top-4 rounded-full bg-zed-950 px-3 py-1.5 text-xs font-bold text-white">
          -{sale}%
        </span>
      )}
      {count > 1 && (
        <span className="absolute right-4 top-4 rounded-full bg-black/45 px-2.5 py-1 text-xs font-semibold text-white">
          {index + 1} / {count}
        </span>
      )}
      <button
        type="button"
        onClick={() => setZoomed((z) => !z)}
        aria-label={zoomed ? "Zoom out" : "Zoom in"}
        className="absolute bottom-4 right-4 grid size-9 place-items-center rounded-full bg-white/85 text-[#07111F] shadow transition-colors hover:bg-white sm:size-11"
      >
        <Expand className="size-4" />
      </button>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous photo"
            className="absolute left-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-[#07111F] shadow transition-colors hover:bg-white sm:size-11"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next photo"
            className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-[#07111F] shadow transition-colors hover:bg-white sm:size-11"
          >
            <ChevronRight className="size-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
            {uniq.map((img, i) => (
              <button
                key={`${img.url}-dot-${i}`}
                type="button"
                onClick={() => {
                  const el = trackRef.current;
                  if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
                }}
                aria-label={`Go to photo ${i + 1}`}
                className="grid h-3 min-h-0! min-w-0! place-items-center"
              >
                <span className={`block h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-zed-950" : "w-1.5 bg-charcoal/30"}`} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
