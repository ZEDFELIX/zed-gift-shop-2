"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { trackingConsent } from "@/lib/analytics";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

/**
 * Loads GA4 + Meta Pixel only when their public IDs are configured and the
 * visitor accepted tracking. Also relays data-track clicks as events.
 */
export function Trackers() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const check = () => setAllowed(trackingConsent() === "granted");
    check();
    window.addEventListener("zed:consent", check);
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.("[data-track]");
      if (!el) return;
      const name = el.getAttribute("data-track");
      if (!name) return;
      const value = el.getAttribute("data-track-value");
      import("@/lib/analytics").then(({ trackEvent }) => {
        trackEvent(name, value ? { value } : undefined);
      }).catch(() => undefined);
    };
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("zed:consent", check);
      document.removeEventListener("click", onClick);
    };
  }, []);

  if (!allowed) return null;

  return (
    <>
      {GA_ID ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${GA_ID}', { currency: 'KES' });`}
          </Script>
        </>
      ) : null}
      {PIXEL_ID ? (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init', '${PIXEL_ID}');fbq('track', 'PageView');`}
        </Script>
      ) : null}
    </>
  );
}

export function TrackPageView({ event, params }: { event: string; params?: Record<string, unknown> }) {
  useEffect(() => {
    import("@/lib/analytics").then(({ trackEvent }) => {
      trackEvent(event, params);
    }).catch(() => undefined);
    // Fire once per page view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
