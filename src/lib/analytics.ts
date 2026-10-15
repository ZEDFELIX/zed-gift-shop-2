/**
 * Tiny analytics dispatcher (client-safe).
 *
 * Events go to Google Analytics 4 (via dataLayer) and Meta Pixel (via fbq)
 * only when those libraries were loaded - which only happens when the
 * corresponding public ID is configured AND the visitor accepted tracking.
 * Every call is a no-op otherwise, so instrumenting freely is safe.
 */

const META_MAP: Record<string, string> = {
  view_item: "ViewContent",
  add_to_cart: "AddToCart",
  begin_checkout: "InitiateCheckout",
  purchase: "Purchase",
  search: "Search",
  generate_lead: "Lead",
  whatsapp_click: "Contact",
  phone_click: "Contact",
};

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    const w = window as unknown as {
      dataLayer?: Array<Record<string, unknown>>;
      fbq?: (cmd: string, event: string, params?: Record<string, unknown>) => void;
    };
    if (Array.isArray(w.dataLayer)) w.dataLayer.push({ event: name, ...params });
    const meta = META_MAP[name];
    if (meta && typeof w.fbq === "function") w.fbq("track", meta, params);
  } catch {
    // Analytics must never break shopping.
  }
}

export const CONSENT_KEY = "zed:tracking-consent";

export function trackingConsent(): "granted" | "denied" | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}
