import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { WhatsAppFloat } from "@/components/layout/WhatsAppFloat";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-zed focus:bg-white focus:px-4 focus:py-2 focus:shadow-raised"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="pb-20 lg:pb-0">{children}</main>
      <Footer />
      <CartDrawer />
      <WhatsAppFloat />
    </>
  );
}
