import { Mail, MapPin, Phone } from "lucide-react";
import { SITE } from "@/lib/constants";
import { getSettings, DEFAULTS } from "@/lib/data/settings";

export async function Footer() {
  const settings = await getSettings();
  const storeName = String(settings.storeName ?? SITE.name);
  const phone = String(settings.contactPhone ?? SITE.phoneDisplay);
  const email = String(settings.contactEmail ?? SITE.email);
  const address = String(settings.address ?? SITE.address);
  const hours = String(settings.hours ?? SITE.hours);
  const mapsHref = String(settings.mapsHref ?? SITE.mapsHref);
  const description = String(settings.footerDescription ?? "");
  return (
    <footer className="zed-glass-footer mt-16 border-t border-white/10 text-white">
      <div className="container-zed grid gap-8 py-10 sm:grid-cols-2">
        <div>
          <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-white">Get In Touch</p>
          <ul className="mt-4 space-y-3 text-sm text-white/75">
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 size-4 shrink-0 text-champagne" />
              <a href={`tel:${phone.replace(/\s+/g, "")}`} className="hover:text-white">{phone}</a>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 size-4 shrink-0 text-champagne" />
              <a href={`mailto:${email}`} className="break-all hover:text-white">{email}</a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-champagne" />
              <a href={mapsHref} target="_blank" rel="noreferrer noopener" className="hover:text-white">
                {address}
              </a>
            </li>
            <li className="pt-1 text-white/55">{hours}</li>
          </ul>
        </div>

        <div className="sm:text-right">
          <p className="font-display text-xl font-bold text-white">{storeName}</p>
          {description ? (
            <p className="mt-2 text-sm leading-relaxed text-white/60">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-zed flex flex-col items-center justify-between gap-2 py-5 text-xs text-white/50 sm:flex-row">
          <p>Copyright &copy; {String(settings.copyrightText ?? DEFAULTS.copyrightText).replace(String(new Date().getFullYear()), String(storeName))}</p>
          <p>Prices in {SITE.currencyPrefix}</p>
        </div>
      </div>
    </footer>
  );
}
