import Link from "next/link";
import { Facebook, Instagram, Mail, MapPin, Phone, Send } from "lucide-react";
import { NAV_GROUPS, SITE } from "@/lib/constants";
import { OpenCartLink } from "@/components/cart/OpenCartLink";

const ACCOUNT_LINKS = [
  { label: "My Account", href: "/account" },
  { label: "Checkout", href: "/checkout" },
  { label: "About Us", href: "/about" },
  { label: "Blog", href: "/blog" },
] as const;

const HELP_LINKS = [
  { label: "Track your order", href: "/track" },
  { label: "Contact us", href: "/contact" },
  { label: "FAQs", href: "/faq" },
  { label: "Delivery information", href: "/policies/delivery" },
  { label: "Privacy policy", href: "/policies/privacy" },
  { label: "Terms of service", href: "/policies/terms" },
] as const;

export function Footer() {
  return (
    <footer className="zed-glass-footer mt-16 border-t border-white/10 text-white">
      <div className="container-zed grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <p className="font-display text-lg font-black tracking-[0.06em]">ZED GIFT SHOP 2</p>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            ZED Gift Shop 2 Nairobi Kenya is a highly trusted premium gift shop for more than 5 years. We
            provide a wide range of premium gifts, door gifts, corporate gifts and are well known for our
            expertise and customer focus in customising them according to your specifications.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <a
              href={SITE.social.x}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="X"
              className="grid size-9 place-items-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-champagne hover:text-white"
            >
              <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
                <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-6.4L6.4 22H3.3l7.3-8.3L1.6 2H8l4.4 5.9L18.9 2Zm-1.1 18h1.7L7.1 3.9H5.3L17.8 20Z" />
              </svg>
            </a>
            <a
              href={SITE.social.facebook}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Facebook"
              className="grid size-9 place-items-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-champagne hover:text-white"
            >
              <Facebook className="size-4" />
            </a>
            <a
              href={SITE.social.instagram}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Instagram"
              className="grid size-9 place-items-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-champagne hover:text-white"
            >
              <Instagram className="size-4" />
            </a>
            <a
              href={SITE.social.tiktok}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="TikTok"
              className="grid size-9 place-items-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-champagne hover:text-white"
            >
              <Send className="size-4" />
            </a>
          </div>
        </div>

        <div className="lg:col-span-2">
          <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-white">Get In Touch</p>
          <ul className="mt-4 space-y-3 text-sm text-white/75">
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 size-4 shrink-0 text-champagne" />
              <a href={SITE.phoneHref} className="hover:text-white">{SITE.phoneDisplay}</a>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 size-4 shrink-0 text-champagne" />
              <a href={`mailto:${SITE.email}`} className="break-all hover:text-white">{SITE.email}</a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-champagne" />
              <a href={SITE.mapsHref} target="_blank" rel="noreferrer noopener" className="hover:text-white">
                {SITE.address}
              </a>
            </li>
            <li className="pt-1 text-white/55">{SITE.hours}</li>
          </ul>
        </div>

        <div className="lg:col-span-2">
          <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-white">Shop Categories</p>
          <ul className="mt-4 space-y-2.5 text-sm text-white/75">
            {NAV_GROUPS.map((g) => (
              <li key={g.href}>
                <Link href={g.href} className="hover:text-white">{g.label}</Link>
              </li>
            ))}
            <li><Link href="/shop" className="hover:text-white">Shop All</Link></li>
          </ul>
        </div>

        <div className="lg:col-span-2">
          <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-white">My Account</p>
          <ul className="mt-4 space-y-2.5 text-sm text-white/75">
            <li>
              <OpenCartLink className="text-left transition-colors hover:text-white" />
            </li>
            {ACCOUNT_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-white">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2">
          <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-white">Help</p>
          <ul className="mt-4 space-y-2.5 text-sm text-white/75">
            {HELP_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-white">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-1">
          <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-white">Find Us</p>
          <a
            href={SITE.mapsHref}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-4 block aspect-square w-full overflow-hidden rounded-lg border border-white/15"
          >
            <iframe
              title={SITE.name}
              src={SITE.mapsEmbed}
              className="size-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </a>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-zed flex flex-col items-center justify-between gap-2 py-5 text-xs text-white/50 sm:flex-row">
          <p>Copyright &copy; {new Date().getFullYear()} {SITE.name}, All rights reserved.</p>
          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span>Prices in {SITE.currencyPrefix}</span>
            <span>Payments via M-Pesa, Visa, Mastercard &amp; Amex</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
