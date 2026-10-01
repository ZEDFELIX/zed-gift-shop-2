import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { SITE } from "@/lib/constants";

export const metadata = { title: "FAQs | ZED Gift Shop", description: "Answers about ordering, payment, personalization, delivery and returns from ZED Gift Shop." };

const faqs = [
 {
 q: "How do I pay?",
 a: "We accept M-PESA via STK Push. When you place your order we send a payment request straight to your M-PESA number - approve it with your PIN and your order is confirmed instantly.",
 },
 {
 q: "When will my order arrive?",
 a: "Orders placed before 5:00pm are delivered the same day within Nairobi. Countrywide deliveries usually arrive in 1-3 working days for major towns and 2-7 working days for the rest of Kenya, with tracking.",
 },
 {
 q: "How is delivery charged?",
 a: "Delivery is calculated at checkout based on your county and town, and shown before you pay. Same-day Nairobi delivery is a flat cost (free over the current threshold). You'll see the exact fee right in the checkout summary.",
 },
 {
 q: "Can I send a gift to someone else?",
 a: "Yes. Enter the recipient's name, phone and address at checkout. We'll deliver straight to them, wrap it beautifully, and never include the price on the delivery slip.",
 },
 {
 q: "What can I personalize?",
 a: "Many of our gifts can be engraved, printed or customized - mugs, t-shirts, frames, keyholders, hampers and more. Look for 'Personalize' on product pages and add names, dates or short messages.",
 },
 {
 q: "Can I include a gift message?",
 a: "Of course. Add a handwritten-style gift note at checkout on selected products - it's included in a classic ZED gift box.",
 },
 {
 q: "What if my gift arrives damaged or wrong?",
 a: "Contact us within 48 hours with your order number and photos. We'll arrange a replacement or full refund at no cost to you.",
 },
 {
 q: "Can I return a personalized gift?",
 a: "Because personalized and engraved items are made exactly to your specifications, they aren't returnable unless they arrive faulty or wrong.",
 },
 {
 q: "Do you do corporate and bulk gifts?",
 a: "Yes. We handle corporate gifting, team gifts and bulk orders - visit the Corporate gifts page or email us and we'll follow up.",
 },
];

export default function FaqPage() {
 return (
 <div className="container-zed max-w-3xl py-12">
 <p className="eyebrow text-soft-sage">Good to know</p>
 <h1 className="mt-2 font-display text-4xl font-black text-[#07111F]">Frequently asked questions</h1>
 <p className="mt-4 text-[#07111F]">
 Everything about ordering, payment, personalization and delivery. Can&apos;t find your answer?{" "}
 <Link href="/contact" className="text-soft-sage underline underline-offset-2">Contact us</Link> or WhatsApp{" "}
 <a className="text-soft-sage underline underline-offset-2" href={SITE.phoneHref}>{SITE.phone}</a>.
 </p>

 <div className="mt-10 space-y-3">
 {faqs.map((f) => (
 <details key={f.q} className="glass-panel group rounded-2xl p-1">
 <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 font-display font-semibold text-[#07111F] marker:hidden">
 {f.q}
 <ChevronDown className="size-5 shrink-0 text-soft-sage transition-transform group-open:rotate-180" />
 </summary>
 <p className="px-4 pb-4 text-sm leading-relaxed text-[#07111F]">{f.a}</p>
 </details>
 ))}
 </div>
 </div>
 );
}