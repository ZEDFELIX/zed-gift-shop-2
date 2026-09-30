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
 ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: title }] } : {}),
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
 price: number;
 currency?: string;
 availability?: string;
 sku?: string | null;
}) {
 return {
 "@context": "https://schema.org",
 "@type": "Product",
 name: input.name,
 description: input.description ?? undefined,
 image: input.image ? absolute(input.image) : undefined,
 sku: input.sku ?? undefined,
 offers: {
 "@type": "Offer",
 priceCurrency: input.currency ?? SITE.currency,
 price: input.price,
 availability: input.availability === "out" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
 url: absolute("/"),
 seller: { "@type": "Organization", name: SITE.name, telephone: SITE.phone, email: SITE.email },
 },
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