import { SITE } from "@/lib/constants";

export const metadata = { title: "Privacy Policy | ZED Gift Shop", description: "How ZED Gift Shop collects, uses and protects your personal information." };

function Heading({ n, t }: { n: number; t: string }) {
 return <h2 className="mt-8 font-display text-xl font-bold text-[#07111F]"><span className="text-soft-sage">{n}.</span> {t}</h2>;
}

export default function PrivacyPage() {
 return (
 <div className="container-zed max-w-3xl py-12">
 <p className="eyebrow text-soft-sage">Policies | Last updated {new Date().toDateString()}</p>
 <h1 className="mt-2 font-display text-4xl font-black text-[#07111F]">Privacy Policy</h1>
 <p className="mt-4 text-[#07111F]">This policy explains what we collect, why, and the choices you have. It applies to {SITE.name} ({SITE.url}).</p>

 <Heading n={1} t="What we collect" />
 <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#07111F]">
 <li>Account details: name, email, phone number, and password (stored encrypted).</li>
 <li>Order details: delivery address, gift messages, personalization text you provide, and payment method used. We never store your M-PESA PIN.</li>
 <li>Wishlist and browsing data (cookies) so we can remember your cart and wishlist essentials.</li>
 <li>If you opt in, your email for the newsletter, and occasion/milestone reminders you choose to keep.</li>
 </ul>

 <Heading n={2} t="How we use it" />
 <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#07111F]">
 <li>To process and deliver your orders, including sharing delivery details with our courier partners.</li>
 <li>To take payment securely through M-PESA and to verify payment callbacks.</li>
 <li>To send transactional emails (order confirmations, dispatch and delivery updates, password reset).</li>
 <li>To send marketing emails and reminders only with your consent. You can unsubscribe anytime.</li>
 <li>To improve our store, prevent fraud, and meet legal obligations.</li>
 </ul>

 <Heading n={3} t="Sharing" />
 <p className="mt-3 text-sm leading-relaxed text-[#07111F]">We do not sell your data. We share the minimum necessary with couriers (name, phone, address), M-PESA (payment processing), and email providers (transactional mail).</p>

 <Heading n={4} t="Your choices" />
 <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#07111F]">
 <li>Edit or delete your account anytime from your account settings.</li>
 <li>Unsubscribe from emails with one click.</li>
 <li>Email us to request a copy or deletion of your personal data.</li>
 </ul>

 <Heading n={5} t="Security" />
 <p className="mt-3 text-sm leading-relaxed text-[#07111F]">Your information travels over encrypted connections, passwords are hashed, and access is limited to what each role needs. Questions about privacy? Write to <a className="text-soft-sage underline" href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>
 </div>
 );
}