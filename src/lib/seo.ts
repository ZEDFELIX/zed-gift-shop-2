import type { Metadata } from "next";
import { SITE } from "@/lib/constants";

type SeoInput = {
 title: string;
 description?: string;
 path?: string;
 image?: string;
 type?: "website" | "article";
 publishedTime?: string;
 noindex?: boolean;
};

function isHttpUrl(value: string): boolean {
 return /^https?:\/\/.+/.test(value);
 }

 function absolute(path: string): string {
 if (/^https?:\/\//.test(path)) return path;
 return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
 }

export function buildMetadata(input: SeoInput): Metadata {
 const title = input.title.includes(SITE.name) ? input.title : `${input.title} | ${SITE.name}`;
 const description = input.description ?? SITE.description;
 const url = input.path ? absolute(input.path) : SITE.url;
 const image = input.image ? absolute(input.image) : undefined;

 return {
 title,
 description,
 metadataBase: isHttpUrl(SITE.url) ? new URL(SITE.url) : undefined,
 alternates: { canonical: url },
 robots: input.noindex ? { index: false, follow: false } : undefined,
 openGraph: {
 type: input.type ?? "website",
 url,
 title,
 description,
 siteName: SITE.name,
  ...(image ? { images: [{ url: image, secureUrl: image, width: 1200, height: 630, alt: title }] } : {}),
 ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
 },
 twitter: {
 card: image ? "summary_large_image" : "summary",
 title,
 description,
 ...(image ? { images: [image] } : {}),
 },
 };
}

export function jsonLdProduct(input: {
 name: string;
 description?: string | null;
 image?: string | null;
 images?: (string | null | undefined)[];
 price: number;
 currency?: string;
 availability?: string;
 sku?: string | null;
 url?: string;
 brand?: string;
 category?: string | null;
 ratingValue?: number;
 reviewCount?: number;
 reviews?: { author?: string | null; rating: number; body?: string | null; date?: string | Date | null }[];
}) {
 const images = (input.images ?? [input.image])
 .filter((v): v is string => Boolean(v))
 .map((v) => absolute(v));
 const reviewCount = input.reviewCount ?? 0;
 const ratingValue = input.ratingValue ?? 0;
 return {
 "@context": "https://schema.org",
 "@type": "Product",
 name: input.name,
 description: input.description ?? undefined,
 image: images.length ? images : undefined,
 sku: input.sku ?? undefined,
 ...(input.category ? { category: input.category } : {}),
 brand: { "@type": "Brand", name: (input.brand ?? SITE.name).trim() || SITE.name },
 offers: {
 "@type": "Offer",
 priceCurrency: input.currency ?? SITE.currency,
 price: input.price,
 availability: input.availability === "out" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
 itemCondition: "https://schema.org/NewCondition",
 url: absolute(input.url ?? "/"),
 seller: { "@type": "Organization", name: SITE.name, telephone: SITE.phone, email: SITE.email },
 },
 ...(reviewCount > 0 && ratingValue > 0
 ? {
 aggregateRating: {
 "@type": "AggregateRating",
 ratingValue: Math.round(ratingValue * 10) / 10,
 reviewCount,
 bestRating: 5,
 worstRating: 1,
 },
 }
 : {}),
 ...(input.reviews && input.reviews.length
 ? {
 review: input.reviews.slice(0, 10).map((r) => ({
 "@type": "Review",
 author: { "@type": "Person", name: r.author?.trim() || "ZED Gift Shop customer" },
 reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
 ...(r.body && r.body.trim() ? { reviewBody: r.body.trim() } : {}),
 ...(r.date ? { datePublished: new Date(r.date).toISOString().slice(0, 10) } : {}),
 })),
 }
 : {}),
 };
}

export function jsonLdOrganization() {
 const base = SITE.url.replace(/\/$/, "");
 const profiles = [SITE.social.x, SITE.social.facebook, SITE.social.instagram, SITE.social.tiktok].filter((u) => {
 try {
 return new URL(u).pathname.replace(/\/+$/, "").length > 0;
 } catch {
 return false;
 }
 });
 return {
 "@context": "https://schema.org",
 "@type": "Organization",
 name: SITE.name,
 url: SITE.url,
 logo: `${base}/icon.png`,
 image: `${base}/icon.png`,
 description: SITE.description,
 telephone: SITE.phone,
 email: SITE.email,
 address: {
 "@type": "PostalAddress",
 streetAddress: SITE.address,
 addressLocality: "Nairobi",
 addressCountry: "KE",
 },
 ...(profiles.length ? { sameAs: profiles } : {}),
 contactPoint: [
 {
 "@type": "ContactPoint",
 telephone: SITE.phone,
 contactType: "customer service",
 email: SITE.email,
 areaServed: "KE",
 availableLanguage: ["en"],
 },
 ],
 };
}

export function jsonLdWebsite() {
 const base = SITE.url.replace(/\/$/, "");
 return {
 "@context": "https://schema.org",
 "@type": "WebSite",
 name: SITE.name,
 url: SITE.url,
 potentialAction: {
 "@type": "SearchAction",
 target: {
 "@type": "EntryPoint",
 urlTemplate: `${base}/search?q={search_term_string}`,
 },
 "query-input": "required name=search_term_string",
 },
 };
}

export function jsonLdFaq(items: { q: string; a: string }[]) {
 return {
 "@context": "https://schema.org",
 "@type": "FAQPage",
 mainEntity: items.map((item) => ({
 "@type": "Question",
 name: item.q,
 acceptedAnswer: { "@type": "Answer", text: item.a },
 })),
 };
}

export function jsonLdStore() {
 return {
 "@context": "https://schema.org",
 "@type": "Store",
 name: SITE.name,
 telephone: SITE.phone,
 email: SITE.email,
 url: SITE.url,
 description: SITE.description,
 paymentAccepted: "M-PESA, Cash on Delivery",
 priceRange: "KES",
 contactPoint: [
 { "@type": "ContactPoint", telephone: SITE.phone, contactType: "customer service", email: SITE.email },
 ],
 };
}

export function jsonLdBreadcrumb(items: { name: string; path: string }[]) {
  return {
 "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, i) => ({
  "@type": "ListItem",
  position: i + 1,
  name: item.name,
  item: absolute(item.path),
  })),
  };
}

export function jsonLdItemList(items: { name: string; path: string; image?: string | null }[]) {
  return {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: items.slice(0, 20).map((item, i) => ({
  "@type": "ListItem",
  position: i + 1,
  name: item.name,
  url: absolute(item.path),
  ...(item.image ? { image: absolute(item.image) } : {}),
  })),
  };
}