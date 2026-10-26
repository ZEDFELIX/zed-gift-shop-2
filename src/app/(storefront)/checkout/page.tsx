import "server-only";

import Link from "next/link";
import { readCart, serializeCart } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import { KENYA_COUNTIES } from "@/lib/constants";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { TrackPageView } from "@/components/analytics/Trackers";
import { SITE, bankTransferConfigured } from "@/lib/constants";
import { flutterwaveConfigured } from "@/lib/flutterwave";
import { ShieldCheck, Truck } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = { title: "Checkout", description: "Checkout securely with M-PESA STK Push, or another payment method available for your order." };

export default async function CheckoutPage() {
 const [{ cart }, user] = await Promise.all([readCart().then(async ({ cart }) => ({ cart: cart ? await serializeCart(cart) : null })), getCurrentUser()]);

 if (!cart || (cart.items.length === 0 && cart.count === 0)) {
 return (
 <div className="glass-panel mx-auto max-w-md py-20 text-center">
 <p className="font-display text-2xl font-bold text-[#07111F]">Your cart is empty</p>
 <p className="mt-2 text-[#334155]">Add a gift first, then check out.</p>
 <Link href="/shop" className="mt-6 inline-flex rounded-zed bg-zed-950 px-6 py-3 text-sm font-bold text-white">
 Browse gifts
 </Link>
 </div>
 );
 }

  return (
  <div className="container-zed py-10 lg:py-14">
  <TrackPageView
    event="begin_checkout"
    params={{ currency: "KES", value: cart.subtotal, items: cart.items.map((i) => ({ item_id: i.productId, quantity: i.quantity })) }}
  />
  <header className="mb-8">
 <p className="eyebrow">Checkout</p>
 <h1 className="mt-2 font-display text-2xl font-bold text-[#07111F] lg:text-4xl">Checkout</h1>
<p className="mt-2 flex items-center gap-2 text-sm text-[#334155]">
   <ShieldCheck className="size-4 text-soft-sage" /> Checkout is protected. Choose from the payment methods available for your order.
  </p>
 </header>

 <CheckoutForm
 initialCart={cart}
 counties={KENYA_COUNTIES as unknown as string[]}
 user={user ? { name: user.name, email: user.email, phone: user.phone ?? "" } : null}
sitePhone={SITE.phone}
   bankTransferAvailable={bankTransferConfigured()}
   cardAvailable={flutterwaveConfigured()}
   />

 <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-[#334155]">
 <Truck className="size-4 text-soft-sage" /> Same-day Nairobi before 5 PM | Countrywide in 1–7 working days
 </p>
 </div>
 );
}