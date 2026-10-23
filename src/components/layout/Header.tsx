import "server-only";

import { SITE } from "@/lib/constants";
import { cartSummaryForHeader } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import { getSetting } from "@/lib/data/settings";
import { HeaderContent } from "@/components/layout/HeaderContent";

export async function Header() {
  const [cart, user, announcementRaw, contactPhoneRaw, storeNameRaw, whatsappRaw] = await Promise.all([
    cartSummaryForHeader().catch(() => ({ count: 0, subtotal: 0 })),
    getCurrentUser().catch(() => null),
    getSetting("announcementBar").catch(() => null),
    getSetting("contactPhone").catch(() => null),
    getSetting("storeName").catch(() => null),
    getSetting("whatsappNumber").catch(() => null),
  ]);
  const cartCount = cart.count;
  const announcement = typeof announcementRaw === "string" ? announcementRaw : "";
  const contactPhone = typeof contactPhoneRaw === "string" && contactPhoneRaw.trim() ? contactPhoneRaw : SITE.phone;
  const storeName = typeof storeNameRaw === "string" && storeNameRaw.trim() ? storeNameRaw : SITE.name;
  const whatsappNumber = typeof whatsappRaw === "string" && whatsappRaw.trim() ? whatsappRaw.trim() : SITE.whatsappNumber;

  return (
    <HeaderContent
      cartCount={cartCount}
      cartSubtotal={cart.subtotal}
      announcement={announcement}
      contactPhone={contactPhone}
      whatsappNumber={whatsappNumber}
      storeName={storeName}
      isAuthed={Boolean(user)}
      userRole={user?.role ?? null}
    />
  );
}
