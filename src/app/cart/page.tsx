import { redirect } from "next/navigation";

/** Keep legacy and shared cart links working; checkout already renders the current cart. */
export default function CartPage() {
  redirect("/checkout");
}
