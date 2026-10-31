import "server-only";

import { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { roboto } from "@/app/fonts";
import { SITE } from "@/lib/constants";
import { getSettings } from "@/lib/data/settings";
import { buildMetadata, jsonLdOrganization, jsonLdWebsite } from "@/lib/seo";
import { ToastHost } from "@/components/ui/ToastHost";
import { ServiceWorkerReg } from "@/components/layout/ServiceWorkerReg";
import { AppLaunchScreen } from "@/components/layout/AppLaunchScreen";
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
  themeColor: "#6B2D5C",
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
 const primary = String(settings.primaryColor ?? "#E5397F");
 const secondary = String(settings.secondaryColor ?? "#6B2D5C");
 const accent = String(settings.accentColor ?? "#7C3AED");
  const background = String(settings.backgroundColor ?? "#FFFFFF");
  const announcementColor = String(settings.announcementColor ?? "#6B2D5C");
  const colors = {
  "--color-rose-500": primary,
  "--color-rose-600": primary,
  "--color-rose-400": primary,
  "--color-rose-700": primary,
  "--color-plum-800": secondary,
  "--color-plum-900": secondary,
  "--color-plum-700": secondary,
  "--color-plum-950": secondary,
  "--color-violet-500": accent,
  "--color-violet-600": accent,
  "--color-violet-700": accent,
  "--color-deep-olive": secondary,
  "--color-soft-sage": primary,
  "--color-champagne": accent,
  "--color-zed-950": secondary,
  "--color-zed-900": secondary,
  "--color-zed-800": secondary,
  "--color-zed-700": secondary,
  "--color-zed-600": primary,
  "--color-pure-white": background,
  "--color-warm-white": background,
  "--color-warm-ivory": background,
  "--color-announcement": announcementColor,
  "--color-announcement-fg": readableTextColor(announcementColor),
 } as CSSProperties;
 return (
    <html
      lang="en"
      className={roboto.variable}
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
    <AppLaunchScreen />
    <ToastHost />
    <ServiceWorkerReg />
  </body>
 </html>
 );
}