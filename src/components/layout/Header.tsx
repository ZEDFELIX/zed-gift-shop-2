import "server-only";

import { SITE } from "@/lib/constants";
import { cartSummaryForHeader } from "@/lib/cart";
import { getWishlistIds } from "@/lib/wishlist";
import { getCurrentUser } from "@/lib/auth";
import { getSetting } from "@/lib/data/settings";
import { getNavFeatured } from "@/lib/data/storefront";
import { HeaderContent } from "@/components/layout/HeaderContent";

export async function Header() {
  const [cart, user, announcementRaw, contactPhoneRaw, storeNameRaw, featured] = await Promise.all([
    cartSummaryForHeader().catch(() => ({ count: 0, subtotal: 0 })),
    getCurrentUser().catch(() => null),
    getSetting("announcementText").catch(() => null),
    getSetting("contactPhone").catch(() => null),
    getSetting("storeName").catch(() => null),
    getNavFeatured().catch(() => ({})),
  ]);
  const cartCount = cart.count;
  const wishlistCount = user ? (await getWishlistIds(user.id).catch(() => []))?.length : 0;
  const announcement = typeof announcementRaw === "string" && announcementRaw.trim() ? announcementRaw : SITE.announcementRight;
  const contactPhone = typeof contactPhoneRaw === "string" && contactPhoneRaw.trim() ? contactPhoneRaw : SITE.phone;
  const storeName = typeof storeNameRaw === "string" && storeNameRaw.trim() ? storeNameRaw : SITE.name;

  return (
    <HeaderContent
      cartCount={cartCount}
      cartSubtotal={cart.subtotal}
      wishlistCount={wishlistCount}
      announcement={announcement}
      contactPhone={contactPhone}
      storeName={storeName}
      isAuthed={Boolean(user)}
      userRole={user?.role ?? null}
      featured={featured}
    />
  );
}
