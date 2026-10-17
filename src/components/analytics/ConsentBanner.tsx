"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CONSENT_KEY, trackingConsent } from "@/lib/analytics";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

/**
 * Small cookie-consent banner. Only appears when at least one tracker is
 * configured and the visitor hasn't chosen yet. Accepting loads the trackers.
 */
export function ConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!GA_ID && !PIXEL_ID) return;
    if (trackingConsent() !== null) return;
    const t = window.setTimeout(() => setShow(true), 2500);
    return () => window.clearTimeout(t);
  }, []);

  function choose(value: "granted" | "denied") {
    try {
      window.localStorage.setItem(CONSENT_KEY, value);
    } catch {
      // Continue without persistence.
    }
    window.dispatchEvent(new Event("zed:consent"));
    setShow(false);
    if (value === "granted") window.location.reload();
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-3 bottom-20 z-[80] mx-auto max-w-md rounded-2xl border border-white/60 bg-white/90 p-4 shadow-glass-lg backdrop-blur-xl sm:bottom-6 lg:left-auto lg:right-6 lg:mx-0" role="dialog" aria-label="Cookie consent">
      <p className="text-sm font-semibold text-[#07111F]">We use cookies to improve your shopping</p>
      <p className="mt-1 text-xs leading-relaxed text-[#334155]">
        With your permission we measure visits and orders to make the shop better. No selling of data, ever. See our{" "}
        <Link href="/policies/cookies" className="font-semibold text-soft-sage underline underline-offset-2">Cookie Policy</Link>{" "}
        and{" "}
        <Link href="/policies/privacy" className="font-semibold text-soft-sage underline underline-offset-2">Privacy Policy</Link>.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => choose("granted")}
          className="flex-1 rounded-zed bg-zed-950 px-4 py-2.5 text-sm font-bold text-white"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => choose("denied")}
          className="flex-1 rounded-zed border border-edge bg-white px-4 py-2.5 text-sm font-semibold text-[#07111F]"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
