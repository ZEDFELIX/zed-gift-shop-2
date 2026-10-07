import "server-only";

import { Metadata, Viewport } from "next";
import { jost, libreBaskerville, poppins, quicksand } from "@/app/fonts";
import { SITE } from "@/lib/constants";
import { buildMetadata, jsonLdStore } from "@/lib/seo";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
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
  themeColor: "#4A2F31",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
 const storeJsonLd = JSON.stringify(jsonLdStore());
 return (
    <html
      lang="en"
      className={`${jost.variable} ${quicksand.variable} ${poppins.variable} ${libreBaskerville.variable}`}
      suppressHydrationWarning
    >
    <body className="zed-page-bg min-h-screen bg-pure-white text-ink font-sans antialiased" suppressHydrationWarning>
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
  <ServiceWorkerReg />
 </body>
 </html>
 );
}