import Link from "next/link";
import { ShoppingBag, ShieldCheck } from "lucide-react";
import { OpenCartLink } from "@/components/cart/OpenCartLink";

export const metadata = {
  title: "Your Cart | ZED Gift Shop",
  description: "Review the gifts in your ZED Gift Shop cart before checkout.",
};

export default function CartPage() {
  return (
    <div className="container-zed max-w-3xl py-10 sm:py-14">
      <nav aria-label="Breadcrumb" className="text-xs text-charcoal/60">
        <Link href="/shop" className="hover:underline">Shop</Link>
        <span aria-hidden="true"> / </span>
        <span className="font-semibold text-[var(--color-ink)]">Your Cart</span>
      </nav>
      <section className="mt-5 rounded-2xl border border-[#eadfe8] bg-white p-6 shadow-sm sm:p-9">
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <span className="grid size-14 place-items-center rounded-full bg-[#f5edf3] text-[#542447]">
            <ShoppingBag className="size-6" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold text-[var(--color-ink)]">Your shopping cart</h1>
          <p className="mt-2 text-sm leading-6 text-charcoal/65">
            Open your cart to review items, update quantities, apply a discount code or continue to checkout.
          </p>
          <OpenCartLink className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#542447] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#3f1b36]" />
          <Link href="/shop" className="mt-3 text-sm font-semibold text-[#542447] underline-offset-4 hover:underline">
            Continue shopping
          </Link>
          <p className="mt-6 flex items-center gap-2 text-xs text-charcoal/55">
            <ShieldCheck className="size-4" /> Checkout options are shown when your cart is ready.
          </p>
        </div>
      </section>
    </div>
  );
}
