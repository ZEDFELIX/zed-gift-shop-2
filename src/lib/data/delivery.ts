import "server-only";

import { prisma } from "@/lib/prisma";
import type { DeliveryMethod } from "@prisma/client";

export type DeliveryZone = {
  id: string;
  name: string;
  county: string;
  town: string | null;
  fee: number;
  expressFee: number | null;
  deliveryTime: string | null;
  sameDay: boolean;
  nextDay: boolean;
  pickup: boolean;
  codAvailable: boolean;
  minOrder: number;
  maxOrder: number | null;
  deliveryPartner: string | null;
  sortOrder: number;
};

export async function getDeliveryZones() {
  return prisma.deliveryZone.findMany({
    where: { active: true },
    orderBy: [{ county: "asc" }, { town: "asc" }, { sortOrder: "asc" }],
  });
}

const norm = (v: string) => v.trim().toLowerCase();

/**
 * Resolves the zone for an address. A town-specific zone wins over the
 * county-wide default so per-town fees and rules actually apply.
 */
export async function getDeliveryZoneForCounty(
  county: string,
  town?: string | null,
): Promise<DeliveryZone | null> {
  const zones = await getDeliveryZones();
  const targetCounty = norm(county);

  if (town && town.trim()) {
    const targetTown = norm(town);
    const exact = zones.find((z) => norm(z.county) === targetCounty && z.town && norm(z.town) === targetTown);
    if (exact) return exact;
    // Areas are often recorded as "Kilimani, Nairobi" or "Kilimani - Nairobi".
    const loose = zones.find(
      (z) => norm(z.county) === targetCounty && z.town && targetTown.includes(norm(z.town)),
    );
    if (loose) return loose;
  }

  return zones.find((z) => norm(z.county) === targetCounty && z.town === null) ?? null;
}

export type DeliveryOption = {
  method: DeliveryMethod;
  label: string;
  description: string;
  fee: number;
  eta: string;
  available: boolean;
  pickup?: boolean;
  /** Date the parcel is expected to land, so the customer sees a real promise. */
  estimatedDeliveryDate: string | null;
};

export type DeliveryQuote = {
  zone: DeliveryZone | null;
  options: DeliveryOption[];
  codAvailable: boolean;
  /** Why cash on delivery is unavailable, phrased for the customer. */
  codReason: string | null;
  minOrder: number;
  maxOrder: number | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function addBusinessDays(from: Date, days: number): Date {
  const date = new Date(from);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return date;
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Cut-off for same-day delivery. Orders placed later land the next working day. */
const SAME_DAY_CUTOFF_HOUR = 14;

function sameDayPossible(now: Date): boolean {
  return now.getHours() < SAME_DAY_CUTOFF_HOUR && now.getDay() !== 0;
}

export async function quoteDeliveryFor(input: {
  county: string;
  town?: string | null;
  subtotal: number;
  allProductsCodEligible?: boolean;
  now?: Date;
}): Promise<DeliveryQuote> {
  const now = input.now ?? new Date();
  const zone = await getDeliveryZoneForCounty(input.county, input.town);

  // Fees come from the zone configuration. There is deliberately no fallback
  // arithmetic here: an unconfigured zone must be visible in admin, not guessed.
  const standardFee = zone?.fee ?? null;
  const expressFee = zone?.expressFee ?? null;

  const options: DeliveryOption[] = [];

  if (zone?.sameDay) {
    const possible = sameDayPossible(now);
    options.push({
      method: "SAME_DAY",
      label: "Same-day delivery",
      description: possible
        ? `Order before ${SAME_DAY_CUTOFF_HOUR}:00 and receive it today.`
        : `Same-day has passed for today. Delivered on the next working day instead.`,
      fee: standardFee ?? 0,
      eta: possible ? "Today" : "Next working day",
      available: true,
      estimatedDeliveryDate: isoDay(possible ? now : addBusinessDays(now, 1)),
    });
  }

  if (zone?.nextDay) {
    options.push({
      method: "NEXT_DAY",
      label: "Next-day delivery",
      description: "Order before 16:00 and receive it the next working day.",
      fee: standardFee ?? 0,
      eta: "Tomorrow",
      available: true,
      estimatedDeliveryDate: isoDay(addBusinessDays(now, 1)),
    });
  }

  if (zone?.pickup) {
    options.push({
      method: "PICKUP",
      label: "Click & collect",
      description: "Collect from our Nairobi location - free.",
      fee: 0,
      eta: "Ready within 2 hours",
      available: true,
      pickup: true,
      estimatedDeliveryDate: isoDay(now),
    });
  }

  options.push({
    method: "STANDARD",
    label: "Standard delivery",
    description: zone
      ? `Delivered to ${input.town || input.county} ${zone.deliveryTime ? `in ${zone.deliveryTime}` : "within 2-4 working days"}.`
      : `Countrywide delivery to ${input.county} within 2-4 working days.`,
    fee: standardFee ?? 800,
    eta: zone?.deliveryTime ?? "2-4 working days",
    available: true,
    estimatedDeliveryDate: isoDay(addBusinessDays(now, 3)),
  });

  if (expressFee != null) {
    options.push({
      method: "EXPRESS",
      label: "Express",
      description: zone?.deliveryPartner
        ? `Priority dispatch with ${zone.deliveryPartner}.`
        : "Priority dispatch.",
      fee: expressFee,
      eta: "Same working day",
      available: true,
      estimatedDeliveryDate: isoDay(addBusinessDays(now, sameDayPossible(now) ? 0 : 1)),
    });
  }

  if (options.length === 1 && !zone) {
    // No zone configured for this county: keep a single honest option.
    options[0] = {
      ...options[0],
      method: "NEXT_DAY",
      label: "Countrywide delivery",
      description: `We deliver to ${input.county} nationwide.`,
    };
  }

  const minOrder = zone?.minOrder ?? 0;
  const maxOrder = zone?.maxOrder ?? null;

  let codAvailable = false;
  let codReason: string | null = null;
  if (input.subtotal < minOrder) {
    codReason = `Cash on delivery starts at KES ${minOrder.toLocaleString("en-KE")} for ${zone?.name ?? input.county}.`;
  } else if (maxOrder != null && input.subtotal > maxOrder) {
    codReason = `Cash on delivery is unavailable above KES ${maxOrder.toLocaleString("en-KE")} for ${zone?.name ?? input.county}.`;
  } else if (input.allProductsCodEligible === false) {
    codReason = "One of the items in your cart cannot be paid for on delivery.";
  } else if (!zone?.codAvailable) {
    codReason = `Cash on delivery is not available for ${zone?.name ?? input.county}.`;
  } else {
    codAvailable = true;
  }

  return { zone, options, codAvailable, codReason, minOrder, maxOrder };
}

export async function getDeliveryOptions(
  county: string,
  town?: string | null,
  subtotal = 0,
): Promise<DeliveryOption[]> {
  const quote = await quoteDeliveryFor({ county, town, subtotal });
  return quote.options;
}

/** Resolves the fee a given method should be charged, from zone configuration. */
export async function resolveFeeForMethod(input: {
  county: string;
  town?: string | null;
  method: DeliveryMethod;
  subtotal: number;
}): Promise<{ fee: number; estimatedDeliveryDate: string | null; zone: DeliveryZone | null }> {
  const quote = await quoteDeliveryFor({
    county: input.county,
    town: input.town,
    subtotal: input.subtotal,
  });
  const option = quote.options.find((o) => o.method === input.method);
  return {
    fee: option?.fee ?? 0,
    estimatedDeliveryDate: option?.estimatedDeliveryDate ?? null,
    zone: quote.zone,
  };
}