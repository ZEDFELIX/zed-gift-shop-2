import Link from "next/link";
import { SITE } from "@/lib/constants";
import { getSettings } from "@/lib/data/settings";

export const metadata = { title: "Returns & Refunds | ZED Gift Shop", description: "How returns, exchanges and refunds work at ZED Gift Shop, including faulty items and personalized gifts." };

function Heading({ n, t }: { n: number; t: string }) {
  return <h2 className="mt-8 font-display text-xl font-bold text-[#07111F]"><span className="text-soft-sage">{n}.</span> {t}</h2>;
}

export default async function RefundsPolicyPage() {
  const settings = await getSettings();
  const policyPhone = String(settings.contactPhone ?? SITE.phone);
  const policyPhoneHref = `tel:${policyPhone.replace(/\s+/g, "")}`;
  return (
    <div className="container-zed max-w-3xl py-12">
      <p className="eyebrow text-soft-sage">Policies | Last updated {new Date().toDateString()}</p>
      <h1 className="mt-2 font-display text-4xl font-black text-[#07111F]">Returns &amp; Refunds</h1>
      <p className="mt-4 text-[#07111F]">
        We want you to love your gift. If something isn&apos;t right, here is how returns, exchanges and refunds work. This
        page forms part of our{" "}
        <Link href="/policies/delivery" className="text-soft-sage underline underline-offset-2">Delivery &amp; Returns</Link>{" "}
        terms.
      </p>

      <Heading n={1} t="Faulty, damaged or wrong items" />
      <p className="mt-3 text-sm leading-relaxed text-[#07111F]">
        If your order arrives damaged, is the wrong item, or has a genuine fault, contact us within 48 hours of delivery
        with your order number and photos. We&apos;ll arrange a replacement or a full refund at no cost to you.
      </p>

      <Heading n={2} t="Change of mind" />
      <p className="mt-3 text-sm leading-relaxed text-[#07111F]">
        Because nearly everything we sell is personalized to your order, we can&apos;t offer returns for changed minds on
        customized, engraved, or perishable items. For non-personalized, unused items in their original packaging, you have
        7 days from delivery to request an exchange or refund.
      </p>

      <Heading n={3} t="Personalized gifts" />
      <p className="mt-3 text-sm leading-relaxed text-[#07111F]">
        Personalized and engraved items are made exactly to your specifications, so they aren&apos;t returnable - unless
        they arrive faulty or wrong. Please double-check all spelling, dates and numbers before ordering.
      </p>

      <Heading n={4} t="How refunds are processed" />
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#07111F]">
        <li>Approved refunds are sent back to the M-PESA account used for payment.</li>
        <li>Refunds are processed within 5 working days after the returned item is received by us.</li>
      </ul>

      <Heading n={5} t="How to start a return" />
      <p className="mt-3 text-sm leading-relaxed text-[#07111F]">
        Call or WhatsApp <a className="break-all font-semibold text-soft-sage underline" href={policyPhoneHref}>{policyPhone}</a>{" "}
        with your order number and a description (and photos where relevant). Our team will confirm the next steps and
        arrange the return or replacement.
      </p>
    </div>
  );
}
