import Link from "next/link";
import { SITE } from "@/lib/constants";

export const metadata = { title: "Cookie Policy | ZED Gift Shop", description: "The cookies and local storage ZED Gift Shop uses, what they do, and how to control them." };

function Heading({ n, t }: { n: number; t: string }) {
  return <h2 className="mt-8 font-display text-xl font-bold text-[#07111F]"><span className="text-soft-sage">{n}.</span> {t}</h2>;
}

export default function CookiePolicyPage() {
  return (
    <div className="container-zed max-w-3xl py-12">
      <p className="eyebrow text-soft-sage">Policies | Last updated {new Date().toDateString()}</p>
      <h1 className="mt-2 font-display text-4xl font-black text-[#07111F]">Cookie Policy</h1>
      <p className="mt-4 text-[#07111F]">
        This policy explains the cookies and browser storage {SITE.name} uses, and the choices you have. It should be read
        together with our{" "}
        <Link href="/policies/privacy" className="text-soft-sage underline underline-offset-2">Privacy Policy</Link>.
      </p>

      <Heading n={1} t="What are cookies?" />
      <p className="mt-3 text-sm leading-relaxed text-[#07111F]">
        Cookies are small files a website stores in your browser. We also use your browser&apos;s local storage. They let the
        site remember things between visits, such as what is in your cart or wishlist.
      </p>

      <Heading n={2} t="Strictly necessary cookies" />
      <p className="mt-3 text-sm leading-relaxed text-[#07111F]">
        These are needed for the shop to work and are always on. They do not track you across other websites.
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#07111F]">
        <li><span className="font-semibold">Cart</span> - remembers the items in your cart between pages and visits.</li>
        <li><span className="font-semibold">Session</span> - keeps you signed in to your account securely.</li>
        <li><span className="font-semibold">Wishlist</span> - remembers the gifts you have saved.</li>
      </ul>

      <Heading n={3} t="Your consent choice" />
      <p className="mt-3 text-sm leading-relaxed text-[#07111F]">
        When you accept or decline tracking in the cookie banner, we save that choice in your browser so we do not ask
        again. You can change your choice at any time by clearing your browser storage for this site, and the banner will
        reappear.
      </p>

      <Heading n={4} t="Analytics cookies (optional)" />
      <p className="mt-3 text-sm leading-relaxed text-[#07111F]">
        If measurement tools are enabled on the store, we use analytics - such as Google Analytics and the Meta Pixel - to
        understand how visitors use the shop. These load <span className="font-semibold">only if you accept</span> in the
        cookie banner. If you decline, they are not loaded and we do not measure your visit. We never sell your data.
      </p>

      <Heading n={5} t="Managing cookies" />
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#07111F]">
        <li>Use the cookie banner to accept or decline analytics.</li>
        <li>Clear or block cookies in your browser settings - note that strictly necessary cookies are required to shop.</li>
        <li>Declining analytics does not affect your ability to browse, add to cart, or check out.</li>
      </ul>

      <Heading n={6} t="Questions" />
      <p className="mt-3 text-sm leading-relaxed text-[#07111F]">
        Questions about cookies? Email{" "}
        <a className="break-all text-soft-sage underline" href={`mailto:${SITE.email}`}>{SITE.email}</a>.
      </p>
    </div>
  );
}
