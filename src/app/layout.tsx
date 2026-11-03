import "server-only";

import { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { SITE } from "@/lib/constants";
import { buildMetadata, jsonLdOrganization, jsonLdWebsite } from "@/lib/seo";
import { getSettings } from "@/lib/data/settings";
import { ToastHost } from "@/components/ui/ToastHost";
import { ServiceWorkerReg } from "@/components/layout/ServiceWorkerReg";
import { PageThemeScope } from "@/components/layout/PageThemeScope";
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
  const textColors = (settings.textColors && typeof settings.textColors === "object" ? settings.textColors : {}) as Record<string, unknown>;
  const textHeading = validColor(textColors.heading, "#171717");
  const textBody = validColor(textColors.body, "#29232B");
  const textMuted = validColor(textColors.muted, "#716772");
  const buttonText = validColor(textColors.button, "#FFFFFF");
  const pageThemes = (settings.pageThemes && typeof settings.pageThemes === "object" ? settings.pageThemes : {}) as Record<string, Record<string, unknown>>;
  const pageThemeCss = Object.entries(pageThemes).map(([page, theme]) => {
    if (!/^[a-z0-9-]+$/.test(page) || !theme || typeof theme !== "object") return "";
    const vars = { background: validColor(theme.background, background), text: validColor(theme.text, textBody), heading: validColor(theme.heading, textHeading), primary: validColor(theme.primary, primary), button: validColor(theme.button, secondary), buttonText: validColor(theme.buttonText, buttonText), card: validColor(theme.card, "#FFFFFF") };
    return `body[data-zed-page="${page}"]{--zed-page-background:${vars.background};--zed-page-text:${vars.text};--zed-page-heading:${vars.heading};--zed-page-primary:${vars.primary};--zed-page-button:${vars.button};--zed-page-button-text:${vars.buttonText};--zed-page-card:${vars.card};}`;
  }).join("\\n");
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
    "--color-white": "#FFFFFF", "--color-black": "#171717",
    "--color-ink": "#171717", "--color-charcoal": "#171717", "--color-muted": `color-mix(in srgb, ${secondary} 72%, #777777)`,
    "--color-stone": background, "--color-edge": `color-mix(in srgb, ${secondary} 18%, ${background})`, "--color-edge-strong": `color-mix(in srgb, ${secondary} 30%, ${background})`, "--color-panel": background,
    "--color-announcement": announcement, "--color-announcement-fg": readableTextColor(announcement),
    "--zed-plum": primary, "--zed-slate": secondary, "--zed-milk-white": background,
    "--zed-brand-primary": primary, "--zed-brand-secondary": secondary, "--zed-brand-accent": accent,
    "--zed-brand-background": background, "--zed-brand-announcement": announcement,\n    "--zed-text-heading": textHeading, "--zed-text-body": textBody, "--zed-text-muted": textMuted, "--zed-button-text": buttonText,
    "--zed-glass-tint": `color-mix(in srgb, ${primary} 8%, transparent)`,
    "--zed-brand-gradient": `linear-gradient(120deg, ${primary}, ${accent})`,
  } as CSSProperties;

  return (
    <html lang="en" suppressHydrationWarning>
      <body style={colors} className="zed-page-bg min-h-screen bg-pure-white text-ink font-sans antialiased" suppressHydrationWarning>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: storeJsonLd }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: websiteJsonLd }} />
        <PageThemeScope />
        <style dangerouslySetInnerHTML={{ __html: `${pageThemeCss}\nbody{color:var(--zed-text-body)!important} body :is(h1,h2,h3,h4){color:var(--zed-text-heading)} body :is(small,.text-muted){color:var(--zed-text-muted)} body button{color:var(--zed-button-text)!important} body[data-zed-page]{background:var(--zed-page-background,var(--color-pure-white))!important;color:var(--zed-page-text,var(--zed-text-body))!important} body[data-zed-page] :is(h1,h2,h3,h4){color:var(--zed-page-heading,var(--zed-text-heading))!important} body[data-zed-page] main{color:var(--zed-page-text,var(--zed-text-body))} body[data-zed-page] main :is(p,li,label){color:var(--zed-page-text,var(--zed-text-body))} body[data-zed-page] main :is(a,.text-rose-500,.text-rose-600){color:var(--zed-page-primary,var(--zed-brand-primary))} body[data-zed-page] :is(.zed-product-card,.shop-product-card,.glass-panel,.glass-card,.glass-strong,.rounded-zed){background:var(--zed-page-card,#fff)!important} body[data-zed-page] :is(.zed-product-card a,.zed-product-card [class*=text-rose-],.shop-product-card a){color:var(--zed-page-primary,var(--zed-brand-primary))!important} body[data-zed-page] :is(main button,[role=button]){background-color:var(--zed-page-button,var(--zed-brand-secondary));color:var(--zed-page-button-text,var(--zed-button-text))!important}` }} />
        {children}
        <ToastHost />
        <ServiceWorkerReg />
      </body>
    </html>
  );
}
