import "server-only";

import { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { SITE } from "@/lib/constants";
import { buildMetadata, jsonLdOrganization, jsonLdWebsite } from "@/lib/seo";
import { getSettings } from "@/lib/data/settings";
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

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6C2D5C",
};

/** Keep text readable when an administrator chooses a custom background colour. */
function readableTextColor(hex: string): string {
  const match = /^#([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!match) return "#FFFFFF";
  const n = parseInt(match[1], 16);
  const luminance = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return luminance > 0.6 ? "#171717" : "#FFFFFF";
}

function validColor(value: unknown, fallback: string): string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value.trim())
    ? value.trim()
    : fallback;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const storeJsonLd = JSON.stringify(jsonLdOrganization());
  const websiteJsonLd = JSON.stringify(jsonLdWebsite());
  const settings = await getSettings();

  // These settings are read on every dynamic request, so changes saved in
  // Admin > Brand colors immediately theme the whole storefront on refresh.
  const primary = validColor(settings.primaryColor, "#6C2D5C");
  const secondary = validColor(settings.secondaryColor, "#263746");
  const accent = validColor(settings.accentColor, "#7C3AED");
  const background = validColor(settings.backgroundColor, "#FAFAF7");
  const announcement = validColor(settings.announcementColor, primary);
  const foreground = readableTextColor(background);
  const colors = {
    "--color-rose-50": background, "--color-rose-100": background, "--color-rose-200": background, "--color-rose-300": background,
    "--color-rose-400": primary, "--color-rose-500": primary, "--color-rose-600": primary, "--color-rose-700": secondary, "--color-rose-800": secondary, "--color-rose-900": secondary, "--color-rose-950": secondary,
    "--color-plum-50": background, "--color-plum-100": background, "--color-plum-200": background, "--color-plum-300": background,
    "--color-plum-400": primary, "--color-plum-500": primary, "--color-plum-600": primary, "--color-plum-700": secondary, "--color-plum-800": secondary, "--color-plum-900": secondary, "--color-plum-950": secondary,
    "--color-violet-50": background, "--color-violet-100": background, "--color-violet-200": background, "--color-violet-300": background,
    "--color-violet-400": accent, "--color-violet-500": accent, "--color-violet-600": accent, "--color-violet-700": accent, "--color-violet-800": accent, "--color-violet-900": accent, "--color-violet-950": accent,
    "--color-deep-olive": secondary, "--color-soft-sage": primary, "--color-champagne": accent,
    "--color-zed-950": secondary, "--color-zed-900": secondary, "--color-zed-800": secondary, "--color-zed-700": secondary, "--color-zed-600": primary, "--color-zed-500": primary, "--color-zed-lime": accent, "--color-zed-50": background,
    "--color-pure-white": background, "--color-warm-white": background, "--color-warm-ivory": background,
    "--color-white": background, "--color-black": "#171717",
    "--color-ink": "#171717", "--color-charcoal": "#171717", "--color-muted": secondary,
    "--color-stone": background, "--color-edge": secondary, "--color-edge-strong": secondary, "--color-panel": background,
    "--color-announcement": announcement, "--color-announcement-fg": readableTextColor(announcement),
    "--zed-plum": primary, "--zed-slate": secondary, "--zed-milk-white": background,
    "--zed-brand-primary": primary, "--zed-brand-secondary": secondary, "--zed-brand-accent": accent,
    "--zed-brand-background": background, "--zed-brand-announcement": announcement,
    "--zed-glass-tint": `color-mix(in srgb, ${primary} 8%, transparent)`,
    "--zed-brand-gradient": `linear-gradient(120deg, ${primary}, ${accent})`,
  } as CSSProperties;

  return (
    <html lang="en" suppressHydrationWarning>
      <body style={colors} className="zed-page-bg min-h-screen bg-pure-white text-ink font-sans antialiased" suppressHydrationWarning>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: storeJsonLd }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: websiteJsonLd }} />
        {children}
        <ToastHost />
        <ServiceWorkerReg />
      </body>
    </html>
  );
}
