import { SITE } from "@/lib/constants";

export const metadata = { title: "Terms of Service | ZED Gift Shop", description: "Terms of service for zedgiftshop.co.ke purchases and account use." };

function Heading({ n, t }: { n: number; t: string }) {
 return <h2 className="mt-8 font-display text-xl font-bold text-[#07111F]"><span className="text-soft-sage">{n}.</span> {t}</h2>;
}

export default function TermsPage() {
 return (
 <div className="container-zed max-w-3xl py-12">
 <p className="eyebrow text-soft-sage">Policies | Last updated {new Date().toDateString()}</p>
 <h1 className="mt-2 font-display text-4xl font-black text-[#07111F]">Terms of Service</h1>
 <p className="mt-4 text-[#07111F]">By using {SITE.name}, you agree to these terms. Please read them before placing an order.</p>

 <Heading n={1} t="Prices and payment" />
 <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#07111F]">
 <li>All prices are in Kenyan Shillings (KES) and include VAT where applicable, but not delivery.</li>
 <li>Payment is due at checkout via M-PESA STK Push. Orders are only processed once payment is confirmed.</li>
 <li>We may correct pricing errors before processing your order.</li>
 </ul>

 <Heading n={2} t="Orders and personalization" />
 <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#07111F]">
 <li>With personalized items, please double-check all spelling, dates and numbers - we can&apos;t redo items made exactly to your specifications.</li>
 <li>We reserve the right to decline or cancel an order (for example, if an item is unavailable or stock is mis-recorded), and will refund any payment made.</li>
 </ul>

 <Heading n={3} t="Delivery" />
 <p className="mt-3 text-sm leading-relaxed text-[#07111F]">We aim to meet the delivery times published on our Delivery &amp; Returns page. Times are estimates, not guarantees. If a delivery fails because the provided address or phone is incorrect, re-dispatch costs are your responsibility.</p>

 <Heading n={4} t="Returns" />
 <p className="mt-3 text-sm leading-relaxed text-[#07111F]">Personalized, customized, and perishable items are non-returnable unless faulty. See our Delivery &amp; Returns page for the full policy.</p>

 <Heading n={5} t="Content and conduct" />
 <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#07111F]">
 <li>Gift messages and personalization must not be unlawful, offensive, or infringe anyone&apos;s rights.</li>
 <li>Reviews you submit are your own views; we may moderate or remove content that breaches these terms.</li>
 <li>Do not misuse the site - attempting to disrupt, scrape, or exploit it is prohibited.</li>
 </ul>

 <Heading n={6} t="Limits of liability" />
 <p className="mt-3 text-sm leading-relaxed text-[#07111F]">To the maximum extent permitted by law, {SITE.name}&apos;s liability is limited to the amount you paid for the affected order. Nothing here limits liability that cannot be excluded under Kenyan law.</p>

 <Heading n={7} t="Governing law" />
 <p className="mt-3 text-sm leading-relaxed text-[#07111F]">These terms are governed by the laws of the Republic of Kenya, and any disputes will be handled in the courts of Kenya. Questions? <a className="text-soft-sage underline" href={`mailto:${SITE.email}`}>{SITE.email}</a></p>
 </div>
 );
}