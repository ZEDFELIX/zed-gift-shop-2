import "server-only";

import { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { jost, libreBaskerville, poppins, quicksand } from "@/app/fonts";
import { SITE } from "@/lib/constants";
import { getSettings } from "@/lib/data/settings";
import { buildMetadata, jsonLdStore } from "@/lib/seo";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ToastHost } from "@/components/ui/ToastHost";
import { ServiceWorkerReg } from "@/components/layout/ServiceWorkerReg";
import { WhatsAppFloat } from "@/components/layout/WhatsAppFloat";
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
  themeColor: "#4A2F31",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
 const storeJsonLd = JSON.stringify(jsonLdStore());
 const settings = await getSettings();
 const primary = String(settings.primaryColor ?? "#E5397F");
 const secondary = String(settings.secondaryColor ?? "#6B2D5C");
 const accent = String(settings.accentColor ?? "#7C3AED");
 const background = String(settings.backgroundColor ?? "#FFFFFF");
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
 } as CSSProperties;
 return (
    <html
      lang="en"
      className={`${jost.variable} ${quicksand.variable} ${poppins.variable} ${libreBaskerville.variable}`}
      suppressHydrationWarning
    >
    <body style={colors} className="zed-page-bg min-h-screen bg-pure-white text-ink font-sans antialiased" suppressHydrationWarning>
    <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: storeJsonLd }}
    />
 <a
 href="#main"
 className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-zed focus:bg-white focus:px-4 focus:py-2 focus:shadow-raised"
 >
 Skip to content
 </a>
 <Header />
 <main id="main">{children}</main>
 <Footer />
  <CartDrawer />
  <ToastHost />
  <WhatsAppFloat />
  <ServiceWorkerReg />
 </body>
 </html>
 );
}