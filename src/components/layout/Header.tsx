import "server-only";

import { SITE } from "@/lib/constants";
import { cartSummaryForHeader } from "@/lib/cart";
import { getWishlistIds } from "@/lib/wishlist";
import { getCurrentUser } from "@/lib/auth";
import { getSetting } from "@/lib/data/settings";
import { getNavFeatured } from "@/lib/data/storefront";
import { HeaderContent } from "@/components/layout/HeaderContent";

export async function Header() {
  const [cart, user, announcementRaw, featured] = await Promise.all([
    cartSummaryForHeader().catch(() => ({ count: 0, subtotal: 0 })),
    getCurrentUser().catch(() => null),
    getSetting("announcementText").catch(() => null),
    getNavFeatured().catch(() => ({})),
  ]);
  const cartCount = cart.count;
  const wishlistCount = user ? (await getWishlistIds(user.id).catch(() => []))?.length : 0;
  const announcement =
    typeof announcementRaw === "string" && announcementRaw.trim()
      ? announcementRaw
      : SITE.announcementRight;

  return (
    <HeaderContent
      cartCount={cartCount}
      cartSubtotal={cart.subtotal}
      wishlistCount={wishlistCount}
      announcement={announcement}
      isAuthed={Boolean(user)}
      userRole={user?.role ?? null}
      featured={featured}
    />
  );
}
