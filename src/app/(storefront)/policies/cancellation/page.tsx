import Link from "next/link";
import { SITE } from "@/lib/constants";
import { getSettings } from "@/lib/data/settings";

export const metadata = { title: "Cancellation Policy | ZED Gift Shop", description: "How to cancel an order with ZED Gift Shop, including personalized items and refunds." };

function Heading({ n, t }: { n: number; t: string }) {
  return <h2 className="mt-8 font-display text-xl font-bold text-[#07111F]"><span className="text-soft-sage">{n}.</span> {t}</h2>;
}

export default async function CancellationPolicyPage() {
  const settings = await getSettings();
  const policyPhone = String(settings.contactPhone ?? SITE.phone);
  const policyPhoneHref = `tel:${policyPhone.replace(/\s+/g, "")}`;
  return (
    <div className="container-zed max-w-3xl py-12">
      <p className="eyebrow text-soft-sage">Policies | Last updated {new Date().toDateString()}</p>
      <h1 className="mt-2 font-display text-4xl font-black text-[#07111F]">Cancellation Policy</h1>
      <p className="mt-4 text-[#07111F]">
        This policy explains how order cancellations work at {SITE.name}. It should be read together with our{" "}
        <Link href="/policies/refunds" className="text-soft-sage underline underline-offset-2">Returns &amp; Refunds</Link>{" "}
        and{" "}
        <Link href="/policies/terms" className="text-soft-sage underline underline-offset-2">Terms of Service</Link>.
      </p>

      <Heading n={1} t="Before your order is dispatched" />
      <p className="mt-3 text-sm leading-relaxed text-[#07111F]">
        You can request to cancel an order at any time before it is dispatched. Contact us as soon as possible by phone or
        WhatsApp on{" "}
        <a className="break-all font-semibold text-soft-sage underline" href={policyPhoneHref}>{policyPhone}</a>{" "}
        with your order number. The earlier you tell us, the more likely we can stop it in time.
      </p>

      <Heading n={2} t="Personalized and made-to-order items" />
      <p className="mt-3 text-sm leading-relaxed text-[#07111F]">
        Personalized, engraved and made-to-order gifts go into production quickly. Once we have started making your item, it
        can no longer be cancelled, because it has been made specifically for you.
      </p>

      <Heading n={3} t="If we cancel your order" />
      <p className="mt-3 text-sm leading-relaxed text-[#07111F]">
        We may need to cancel an order - for example if an item becomes unavailable or stock was mis-recorded. If this
        happens, we will let you know and refund any payment you have made.
      </p>

      <Heading n={4} t="Refunds after cancellation" />
      <p className="mt-3 text-sm leading-relaxed text-[#07111F]">
        Where a cancellation is approved and a payment was made, approved refunds are sent back to the M-PESA account used
        for payment, within 5 working days.
      </p>

      <Heading n={5} t="Questions" />
      <p className="mt-3 text-sm leading-relaxed text-[#07111F]">
        Need help with a cancellation? Call or WhatsApp{" "}
        <a className="break-all font-semibold text-soft-sage underline" href={policyPhoneHref}>{policyPhone}</a> or email{" "}
        <a className="break-all text-soft-sage underline" href={`mailto:${SITE.email}`}>{SITE.email}</a>.
      </p>
    </div>
  );
}
