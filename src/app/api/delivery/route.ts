import { NextResponse } from "next/server";
import { quoteDeliveryFor } from "@/lib/data/delivery";
import { getOrCreateCart, unitPrice } from "@/lib/cart";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const county = url.searchParams.get("county")?.trim();
  if (!county) {
    return NextResponse.json({ error: "Missing county." }, { status: 400 });
  }

  const town = url.searchParams.get("town")?.trim() || null;

  // Cash on delivery depends on what is actually in the cart, so the quote is
  // built against real subtotal and per-product eligibility.
  let subtotal = 0;
  let allProductsCodEligible = true;
  try {
    const { cart } = await getOrCreateCart();
    for (const item of cart.items) {
      if (item.savedForLater) continue;
      const { price, giftWrapPrice } = unitPrice(item);
      subtotal += (price + giftWrapPrice) * item.quantity;
      if (!item.product.codEligible) allProductsCodEligible = false;
    }
  } catch {
    // A signed-out or empty cart still gets a usable fee quote.
  }

  const quote = await quoteDeliveryFor({ county, town, subtotal, allProductsCodEligible });

  return NextResponse.json({
    options: quote.options.map((option) => ({ ...option, fee: 0 })),
    codAvailable: quote.codAvailable,
    codReason: quote.codReason,
    zone: quote.zone
      ? {
          name: quote.zone.name,
          county: quote.zone.county,
          town: quote.zone.town,
          deliveryTime: quote.zone.deliveryTime,
          deliveryPartner: quote.zone.deliveryPartner,
        }
      : null,
  });
}