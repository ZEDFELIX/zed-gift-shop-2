import "server-only";

import Link from "next/link";
import { readCart, serializeCart } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import { KENYA_COUNTIES } from "@/lib/constants";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { SITE } from "@/lib/constants";
import { ShieldCheck, Truck } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = { title: "Checkout", description: "Secure checkout with M-PESA STK Push or Flutterwave card payments." };

export default async function CheckoutPage() {
 const [{ cart }, user] = await Promise.all([readCart().then(async ({ cart }) => ({ cart: cart ? await serializeCart(cart) : null })), getCurrentUser()]);

 if (!cart || (cart.items.length === 0 && cart.count === 0)) {
 return (
 <div className="glass-panel mx-auto max-w-md py-20 text-center">
 <p className="font-display text-2xl font-bold text-[#171717]">Your cart is empty</p>
 <p className="mt-2 text-[#6B6B6B]">Add a gift first, then check out.</p>
 <Link href="/shop" className="mt-6 inline-flex rounded-zed bg-zed-950 px-6 py-3 text-sm font-bold text-white">
 Browse gifts
 </Link>
 </div>
 );
 }

 return (
 <div className="container-zed py-10 lg:py-14">
 <header className="mb-8">
 <p className="eyebrow">Secure checkout</p>
 <h1 className="mt-2 font-display text-3xl font-bold text-[#171717] lg:text-4xl">Almost there</h1>
 <p className="mt-2 flex items-center gap-2 text-sm text-[#6B6B6B]">
 <ShieldCheck className="size-4 text-soft-sage" /> Checkout is protected. You&apos;ll confirm payment with an M-PESA STK push to your phone.
 </p>
 </header>

 <CheckoutForm
 initialCart={cart}
 counties={KENYA_COUNTIES as unknown as string[]}
 user={user ? { name: user.name, email: user.email, phone: user.phone ?? "" } : null}
 sitePhone={SITE.phone}
 />

 <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-[#6B6B6B]">
 <Truck className="size-4 text-soft-sage" /> Same-day in Nairobi by 2 PM| Countrywide in 1-3 days
 </p>
 </div>
 );
}