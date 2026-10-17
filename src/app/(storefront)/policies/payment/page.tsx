import Link from "next/link";
import { SITE } from "@/lib/constants";

export const metadata = { title: "Payment Policy | ZED Gift Shop", description: "The payment methods ZED Gift Shop accepts, how we keep payments secure, and when orders are confirmed." };

function Heading({ n, t }: { n: number; t: string }) {
  return <h2 className="mt-8 font-display text-xl font-bold text-[#07111F]"><span className="text-soft-sage">{n}.</span> {t}</h2>;
}

export default function PaymentPolicyPage() {
  return (
    <div className="container-zed max-w-3xl py-12">
      <p className="eyebrow text-soft-sage">Policies | Last updated {new Date().toDateString()}</p>
      <h1 className="mt-2 font-display text-4xl font-black text-[#07111F]">Payment Policy</h1>
      <p className="mt-4 text-[#07111F]">
        All prices on {SITE.name} are in Kenyan Shillings (KES) and include VAT where applicable, but not delivery. The
        payment methods available to you are shown at checkout and may depend on your order and delivery address.
      </p>

      <Heading n={1} t="Payment methods" />
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#07111F]">
        <li><span className="font-semibold">M-PESA (STK Push)</span> - enter your Safaricom number at checkout and approve the request with your M-PESA PIN. No card details are entered on our site.</li>
        <li><span className="font-semibold">Card / Mobile Money</span> - where available, card and mobile-money payments are handled securely by our payment partner.</li>
        <li><span className="font-semibold">Bank transfer</span> - where available, you will receive our account details and a reference, then we confirm payment and dispatch.</li>
        <li><span className="font-semibold">Cash on delivery</span> - available on eligible items and addresses; you pay the rider when your order arrives.</li>
      </ul>

      <Heading n={2} t="Order confirmation" />
      <p className="mt-3 text-sm leading-relaxed text-[#07111F]">
        Orders paid by M-PESA, card or bank transfer are processed once payment is confirmed. Cash on delivery orders are
        paid on arrival.
      </p>

      <Heading n={3} t="Keeping your payment secure" />
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#07111F]">
        <li>We never ask for or store your M-PESA PIN.</li>
        <li>Card details are entered on our payment partner&apos;s secure page and are never stored on our servers.</li>
        <li>Payments travel over encrypted connections.</li>
      </ul>

      <Heading n={4} t="Pricing errors" />
      <p className="mt-3 text-sm leading-relaxed text-[#07111F]">
        If we spot a pricing error before your order is processed, we may correct it or cancel the order and refund any
        payment you have made.
      </p>

      <Heading n={5} t="Refunds" />
      <p className="mt-3 text-sm leading-relaxed text-[#07111F]">
        Approved refunds are sent back to the M-PESA account used for payment, within 5 working days. See our{" "}
        <Link href="/policies/refunds" className="text-soft-sage underline underline-offset-2">Returns &amp; Refunds</Link>{" "}
        policy for details.
      </p>

      <Heading n={6} t="Questions" />
      <p className="mt-3 text-sm leading-relaxed text-[#07111F]">
        Questions about payment? Email{" "}
        <a className="break-all text-soft-sage underline" href={`mailto:${SITE.email}`}>{SITE.email}</a>.
      </p>
    </div>
  );
}
