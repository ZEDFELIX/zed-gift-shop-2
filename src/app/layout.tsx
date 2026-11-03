import "server-only";

import { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { SITE } from "@/lib/constants";
import { getSettings } from "@/lib/data/settings";
import { buildMetadata, jsonLdOrganization, jsonLdWebsite } from "@/lib/seo";
import { ToastHost } from "@/components/ui/ToastHost";
import { ServiceWorkerReg } from "@/components/layout/ServiceWorkerReg";
import "@/app/globals.css";
import "@/app/glassmorphism.css";

export const metadata: Metadata = buildMetadata({
  title: SITE.name,
  path: "/",
  description: SITE.description,
  type: "website",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6C2D5C",
};

/** Picks readable label text (dark or white) for any announcement bar colour. */
function readableTextColor(hex: string): string {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return "#FFFFFF";
  const n = parseInt(m[1], 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.6 ? "#07111F" : "#FFFFFF";
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
 const storeJsonLd = JSON.stringify(jsonLdOrganization());
 const websiteJsonLd = JSON.stringify(jsonLdWebsite());
 const settings = await getSettings();
 const primary = "#6C2D5C"; // Royal Plum
 const secondary = "#263746"; // Midnight Slate
 const background = "#F3F0EA"; // Soft Ivory
 const announcementColor = primary;
 const colors = {
  "--color-rose-50": background, "--color-rose-100": background, "--color-rose-200": background, "--color-rose-300": background,
  "--color-rose-400": primary, "--color-rose-500": primary, "--color-rose-600": primary, "--color-rose-700": secondary, "--color-rose-800": secondary, "--color-rose-900": secondary, "--color-rose-950": secondary,
  "--color-plum-50": background, "--color-plum-100": background, "--color-plum-200": background, "--color-plum-300": background,
  "--color-plum-400": primary, "--color-plum-500": primary, "--color-plum-600": primary, "--color-plum-700": secondary, "--color-plum-800": secondary, "--color-plum-900": secondary, "--color-plum-950": secondary,
  "--color-violet-50": background, "--color-violet-100": background, "--color-violet-200": background, "--color-violet-300": background,
  "--color-violet-400": primary, "--color-violet-500": primary, "--color-violet-600": primary, "--color-violet-700": secondary, "--color-violet-800": secondary, "--color-violet-900": secondary, "--color-violet-950": secondary,
  "--color-deep-olive": secondary, "--color-soft-sage": primary, "--color-champagne": background,
  "--color-zed-950": secondary, "--color-zed-900": secondary, "--color-zed-800": secondary, "--color-zed-700": primary, "--color-zed-600": primary, "--color-zed-500": primary, "--color-zed-lime": background, "--color-zed-50": background,
  "--color-pure-white": background, "--color-warm-white": background, "--color-warm-ivory": background,
  "--color-white": background, "--color-black": secondary,
  "--color-ink": secondary, "--color-charcoal": secondary, "--color-muted": secondary,
  "--color-stone": background, "--color-edge": "#D8D2C9", "--color-edge-strong": "#C7C0B6", "--color-panel": background,
  "--color-announcement": announcementColor, "--color-announcement-fg": "#F3F0EA",
 } as CSSProperties;
 return (
    <html
      lang="en"
      suppressHydrationWarning
    >
    <body style={colors} className="zed-page-bg min-h-screen bg-pure-white text-ink font-sans antialiased" suppressHydrationWarning>
    <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: storeJsonLd }}
    />
    <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: websiteJsonLd }}
    />
   {children}
    <ToastHost />
    <ServiceWorkerReg />
  </body>
 </html>
 );
}