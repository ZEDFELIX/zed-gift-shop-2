import { Truck, RotateCcw, ShieldCheck, MapPin } from "lucide-react";
import { SITE } from "@/lib/constants";
import { getSettings } from "@/lib/data/settings";

export const metadata = { title: "Delivery & Returns | ZED Gift Shop", description: "Same-day Nairobi delivery, countrywide shipping, and our returns policy. How ZED Gift Shop gets your gifts to you." };

export default async function DeliveryPolicyPage() {
 const s = await getSettings();
 const threshold = Number(s.freeShippingThreshold ?? 0);
 const thresholdText = threshold > 0 ? `free above ${new Intl.NumberFormat("en-KE").format(threshold)} KES` : "free on orders whose delivery cost is waived by a coupon";

 return (
 <div className="container-zed max-w-3xl py-12">
 <p className="eyebrow text-soft-sage">Policies</p>
 <h1 className="mt-2 font-display text-4xl font-black text-[#07111F]">Delivery & Returns</h1>

 <section className="mt-10">
 <h2 className="flex items-center gap-2 font-display text-xl font-bold text-[#07111F]"><Truck className="size-6 text-soft-sage" /> Delivery</h2>
 <div className="mt-4 space-y-6 text-sm leading-relaxed text-[#07111F]">
 <div>
 <h3 className="font-semibold text-[#07111F]">Same-day Nairobi delivery</h3>
 <p className="mt-1">Orders placed before 5:00pm are delivered the same day across Nairobi. Same-day is dispatched with our own riders, with live WhatsApp updates, at a flat rate of KES 600 ({thresholdText}).</p>
 </div>
 <div>
 <h3 className="font-semibold text-[#07111F]">Countrywide delivery</h3>
 <p className="mt-1">We ship everywhere in Kenya via reputable courier partners, with tracking. Delivery usually takes 1-3 working days within Nairobi, and 2-7 working days to the rest of the country. Couriers phone the recipient ahead of delivery.</p>
 </div>
 <div>
 <h3 className="font-semibold text-[#07111F]">Delivery to a different person</h3>
 <p className="mt-1">Gifting to someone else? Enter their name and phone number at checkout and we&apos;ll deliver straight to them. The recipient will receive a call from the rider - no mention of the price, promise.</p>
 </div>
 <p className="flex items-center gap-2 rounded-zed glass-panel px-4 py-3 text-deep-olive">
 <MapPin className="size-5 flex-none" /> Delivery rates for your exact county and town are calculated at checkout before you pay.
 </p>
 </div>
 </section>

 <section className="mt-12">
 <h2 className="flex items-center gap-2 font-display text-xl font-bold text-[#07111F]"><RotateCcw className="size-6 text-soft-sage" /> Returns &amp; exchanges</h2>
 <div className="mt-4 space-y-6 text-sm leading-relaxed text-[#07111F]">
 <div>
 <h3 className="font-semibold text-[#07111F]">Wrong, damaged or faulty items</h3>
 <p className="mt-1">If your order arrives damaged, is the wrong item, or has a genuine fault, contact us within 48 hours of delivery with your order number and photos. We&apos;ll arrange a replacement or full refund at no cost to you.</p>
 </div>
 <div>
 <h3 className="font-semibold text-[#07111F]">Change of mind</h3>
 <p className="mt-1">Because nearly everything we sell is personalized to your order, we can&apos;t offer returns for changed minds on customized, engraved, or perishable items. For non-personalized, unused items in original packaging, you have 7 days to request an exchange or refund.</p>
 </div>
 <div>
 <h3 className="font-semibold text-[#07111F]">How refunds work</h3>
 <p className="mt-1">Approved refunds are sent back to the M-PESA account used for payment. Refunds are processed within 5 working days after the returned item is received by us.</p>
 </div>
 <p className="text-[#334155]">Questions? Call or WhatsApp <a className="font-semibold text-soft-sage underline" href={SITE.phoneHref}>{SITE.phone}</a>.</p>
 </div>
 </section>

 <section className="mt-12">
 <h2 className="flex items-center gap-2 font-display text-xl font-bold text-[#07111F]"><ShieldCheck className="size-6 text-soft-sage" /> Important notes</h2>
 <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#07111F]">
 <li>Please double-check the recipient&apos;s address and phone number at checkout - input errors may delay delivery.</li>
 <li>Delivery times are estimates and may be affected by weather, public holidays, or remote locations.</li>
 <li>Tracking details are emailed to you the moment your gift is dispatched.</li>
 </ul>
 </section>
 </div>
 );
}