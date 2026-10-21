import "server-only";

import { getSetting } from "@/lib/data/settings";
import { ReviewsCarousel } from "@/components/shop/ReviewsCarousel";

export type CustomerReview = {
  name: string;
  location: string;
  rating: number;
  text: string;
};

/** Turns whatever is stored in settings into a clean list of reviews. */
function parseReviews(raw: unknown): CustomerReview[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r): r is Record<string, unknown> => Boolean(r) && typeof r === "object")
    .map((r) => ({
      name: String(r.name ?? "").trim(),
      location: String(r.location ?? "").trim(),
      rating: Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5))),
      text: String(r.text ?? "").trim(),
    }))
    .filter((r) => r.name && r.text);
}

export async function CustomerReviews() {
  const [raw, whatsappRaw, contactRaw] = await Promise.all([
    getSetting("customerReviews"),
    getSetting("whatsappNumber"),
    getSetting("contactPhone"),
  ]);
  const reviews = parseReviews(raw);
  if (!reviews.length) return null;

  const number =
    typeof whatsappRaw === "string" && whatsappRaw.trim() ? whatsappRaw.trim() : "254711436169";
  const phone = typeof contactRaw === "string" && contactRaw.trim() ? contactRaw.trim() : "";
  const linkText = phone
    ? `Hi ZED GIFT SHOP, I'd like to add my customer review. (Call: ${phone})`
    : "Hi ZED GIFT SHOP, I'd like to add my customer review.";
  const addHref = `https://wa.me/${number}?text=${encodeURIComponent(linkText)}`;

  return (
    <section className="container-zed mb-10 sm:mb-12" aria-label="Customer reviews">
      <div className="glass-panel rounded-2xl p-3 sm:p-5">
        <ReviewsCarousel reviews={reviews} addHref={addHref} />
      </div>
    </section>
  );
}
