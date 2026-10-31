import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { WhatsAppFloat } from "@/components/layout/WhatsAppFloat";
import { ConsentBanner } from "@/components/analytics/ConsentBanner";
import { Trackers } from "@/components/analytics/Trackers";
import { DownloadAppPopup } from "@/components/layout/DownloadAppButton";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main" className="pb-20 lg:pb-0">{children}</main>
      <Footer />
      <CartDrawer />
      <WhatsAppFloat />
      <Trackers />
      <ConsentBanner />
      <DownloadAppPopup />
    </>
  );
}
