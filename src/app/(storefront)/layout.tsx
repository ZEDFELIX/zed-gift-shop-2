import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { WhatsAppFloat } from "@/components/layout/WhatsAppFloat";
import { ConsentBanner } from "@/components/analytics/ConsentBanner";
import { Trackers } from "@/components/analytics/Trackers";
import { DownloadAppPopup } from "@/components/layout/DownloadAppButton";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main" className="pb-[calc(5.25rem+env(safe-area-inset-bottom))] md:pb-0">{children}</main>
      <Footer />
      <CartDrawer />
      <WhatsAppFloat />
      <Trackers />
      <ConsentBanner />
      <DownloadAppPopup />
      <MobileBottomNav />
    </>
  );
}
