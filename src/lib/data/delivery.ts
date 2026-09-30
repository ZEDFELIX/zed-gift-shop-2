import { prisma } from "@/lib/prisma";
import type { DeliveryMethod } from "@prisma/client";

export type DeliveryZone = {
 id: string;
 county: string;
 town: string | null;
 fee: number;
 deliveryTime: string | null;
 sameDay: boolean;
 nextDay: boolean;
 pickup: boolean;
 sortOrder: number;
};

export async function getDeliveryZones() {
 return prisma.deliveryZone.findMany({ where: { active: true }, orderBy: [{ county: "asc" }, { sortOrder: "asc" }] });
}

export async function getDeliveryZoneForCounty(county: string): Promise<DeliveryZone | null> {
 const zones = await getDeliveryZones();
 const exactTown = zones.find((z) => z.county.toLowerCase() === county.toLowerCase() && z.town !== null);
 const countyDefault = zones.find((z) => z.county.toLowerCase() === county.toLowerCase() && z.town === null);
 return exactTown ?? countyDefault ?? null;
}

export type DeliveryOption = {
 method: DeliveryMethod;
 label: string;
 description: string;
 fee: number;
 eta: string;
 available: boolean;
 pickup?: boolean;
};

export async function getDeliveryOptions(county: string): Promise<DeliveryOption[]> {
 const zone = await getDeliveryZoneForCounty(county);
 const nairobiMain = county.toLowerCase() === "nairobi";

 const options: DeliveryOption[] = [];
 if (zone) {
 if (zone.sameDay || nairobiMain) {
 options.push({
 method: "SAME_DAY",
 label: "Same-day delivery",
 description: nairobiMain ? "Order before 2 PM and receive it today in Nairobi." : "Order before 2 PM and receive it today.",
 fee: nairobiMain ? 350 : zone.fee < 500 ? 500 : zone.fee,
 eta: "Today",
 available: true,
 });
 }
 if (zone.nextDay) {
 options.push({
 method: "NEXT_DAY",
 label: "Next-day delivery",
 description: "Order before 4 PM and receive it tomorrow.",
 fee: Math.round((nairobiMain ? 350 : zone.fee) * 0.7),
 eta: "Tomorrow",
 available: true,
 });
 }
 if (zone.pickup) {
 options.push({
 method: "PICKUP",
 label: "Click & collect",
 description: "Pick up at our Nairobi location - free.",
 fee: 0,
 eta: "Ready within 2 hours",
 available: true,
 pickup: true,
 });
 }
 }

 const standard = options.find((o) => o.method === "NEXT_DAY");
 options.push({
 method: standard ? "STANDARD" : "NEXT_DAY",
 label: "Standard delivery",
 description: zone
 ? `Delivered to ${county} within 2-4 working days.`
 : `Countrywide delivery to ${county} within 2-4 working days.`,
 fee: zone ? (zone.pickup ? Math.max(standard?.fee ?? zone.fee, 400) : zone.fee) : 800,
 eta: zone ? zone.deliveryTime || "2-4 days" : "2-4 days",
 available: true,
 });
 if (nairobiMain) {
 options.push({
 method: "EXPRESS",
 label: "Express (3 hrs)",
 description: "Priority courier within Nairobi. Order before 11 AM.",
 fee: 1200,
 eta: "~3 hours",
 available: true,
 });
 }

 if (options.length === 0) {
 options.push({
 method: "NEXT_DAY",
 label: "Countrywide delivery",
 description: `We deliver to ${county} nationwide.`,
 fee: 800,
 eta: "2-4 days",
 available: true,
 });
 }

 return options;
}