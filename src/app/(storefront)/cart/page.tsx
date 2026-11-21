import { CartPageClient } from "@/components/cart/CartPageClient";

export const metadata = {
  title: "Your Cart | Zed Gift Shop",
  description: "Review your selected gifts, wrapping options and total before checkout.",
};

export default function CartPage() {
  return <CartPageClient />;
}
