"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

export type PromoSlide = {
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  image: string | null;
};

export function PromoSlideshow({ slides }: { slides: PromoSlide[] }) {
  const [index, setIndex] = useState(0);
  const count = slides.length;

  const go = useCallback((dir: 1 | -1) => {
    setIndex((i) => (i + dir + count) % count);
  }, [count]);

  useEffect(() => {
    if (count < 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, 6000);
    return () => window.clearInterval(id);
  }, [count]);

  if (count === 0) return null;

  return (
    <section aria-label="Featured gift collections" className="relative mb-9 overflow-hidden rounded-[1.75rem] sm:mb-11">
      <div className="relative aspect-[4/3] w-full sm:aspect-[21/8]">
        {slides.map((s, i) => (
          <div
            key={s.title}
            className={`absolute inset-0 transition-opacity duration-700 ${i === index ? "z-10 opacity-100" : "z-0 opacity-0"}`}
            aria-hidden={i !== index}
          >
            {s.image ? (
              <Image
                src={s.image}
                alt=""
                fill
                unoptimized
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-zed-950" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />
            <div className="absolute inset-0 flex flex-col justify-center gap-2 p-6 sm:gap-3 sm:p-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70 sm:text-xs">
                Zed Gift Shop
              </p>
              <h2 className="max-w-md font-display text-3xl font-black leading-tight text-white sm:text-5xl">
                {s.title}
              </h2>
              <p className="max-w-md text-sm text-white/80 sm:text-base">{s.subtitle}</p>
              <div className="mt-2">
                <Link
                  href={s.href}
                  className="inline-flex items-center gap-1.5 rounded-zed bg-white px-5 py-2.5 text-sm font-bold text-zed-950 transition-colors hover:bg-white/85"
                >
                  {s.cta} <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 z-20 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/20 text-white backdrop-blur transition-colors hover:bg-white/40"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 z-20 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/20 text-white backdrop-blur transition-colors hover:bg-white/40"
          >
            <ChevronRight className="size-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.title}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
