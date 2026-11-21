"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

type HeroBanner = {
  eyebrow?: string;
  title?: string;
  description?: string;
  buttonLabel?: string;
  buttonHref?: string;
  imageUrls?: string[];
};

export function ShopHeroBanner({ banner, fallbackImages = [] }: { banner: HeroBanner | null; fallbackImages?: string[] }) {
  const slides = useMemo(() => {
    const configured = (banner?.imageUrls ?? []).filter((url): url is string => typeof url === "string" && /^https?:\/\//i.test(url.trim()));
    const source = configured.length ? configured : fallbackImages.filter(Boolean);
    return [...new Set(source)].slice(0, 4);
  }, [banner?.imageUrls, fallbackImages]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 5200);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    setActive(0);
  }, [slides.length]);

  const href = typeof banner?.buttonHref === "string" && (banner.buttonHref.startsWith("/") && !banner.buttonHref.startsWith("//") || banner.buttonHref.startsWith("https://"))
    ? banner.buttonHref
    : "/shop";
  const title = banner?.title?.trim() || "Make every moment feel special.";
  const eyebrow = banner?.eyebrow?.trim() || "Thoughtful gifting starts here";
  const description = banner?.description?.trim() || "Find a thoughtful gift for the people and moments that matter most.";
  const buttonLabel = banner?.buttonLabel?.trim() || "Explore gifts";

  return (
    <section className="zed-shop-hero relative mb-4 overflow-hidden rounded-[22px] sm:mb-6" aria-label="Shop promotions">
      <div className="absolute inset-0 bg-[var(--zed-brand-gradient)]" />
      <div className="relative grid min-h-[210px] grid-cols-1 items-stretch sm:min-h-[250px] md:grid-cols-[1.05fr_.95fr] lg:min-h-[280px]">
        <div className="relative z-10 flex flex-col items-start justify-center px-5 py-6 text-white sm:px-8 sm:py-8 lg:px-10">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/12 px-3 py-1 text-[9px] font-bold uppercase tracking-[.16em] text-white/90 backdrop-blur sm:text-[10px]">
            <Sparkles className="size-3" /> {eyebrow}
          </span>
          <h1 className="mt-3 max-w-xl text-balance font-display text-[clamp(22px,4vw,40px)] font-extrabold leading-[1.05] tracking-tight text-white">{title}</h1>
          <p className="mt-2 max-w-md text-xs leading-relaxed text-white/80 sm:text-sm">{description}</p>
          <Link href={href} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold text-[var(--zed-brand-primary)] shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl sm:text-sm">
            {buttonLabel} <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="relative min-h-[150px] overflow-hidden sm:min-h-[190px] md:min-h-0">
          {slides.length ? (
            <>
              {slides.map((src, index) => (
                <div key={src} className={`absolute inset-0 transition-opacity duration-700 ${index === active ? "opacity-100" : "pointer-events-none opacity-0"}`} aria-hidden={index !== active}>
                  <Image src={src} alt={title} fill priority={index === 0} sizes="(min-width:768px) 48vw, 100vw" unoptimized className="object-cover object-center" />
                </div>
              ))}
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--zed-brand-primary)]/35 via-transparent to-transparent md:from-[var(--zed-brand-primary)]/15" />
              {slides.length > 1 && (
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full border border-white/30 bg-black/20 px-2 py-1.5 backdrop-blur">
                  <button type="button" aria-label="Previous promotion" onClick={() => setActive((current) => (current - 1 + slides.length) % slides.length)} className="grid size-6 place-items-center rounded-full text-white hover:bg-white/20"><ArrowLeft className="size-3.5" /></button>
                  {slides.map((src, index) => <button key={src} type="button" aria-label={`Show promotion ${index + 1}`} aria-current={index === active} onClick={() => setActive(index)} className={`h-1.5 rounded-full transition-all ${index === active ? "w-5 bg-white" : "w-1.5 bg-white/60"}`} />)}
                  <button type="button" aria-label="Next promotion" onClick={() => setActive((current) => (current + 1) % slides.length)} className="grid size-6 place-items-center rounded-full text-white hover:bg-white/20"><ArrowRight className="size-3.5" /></button>
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_65%_45%,rgba(255,255,255,.25),transparent_48%)]">
              <div className="grid size-28 place-items-center rounded-full border border-white/30 bg-white/10 text-5xl shadow-2xl backdrop-blur sm:size-36">🎁</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
