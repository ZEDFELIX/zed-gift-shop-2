import "server-only";

import { prisma } from "@/lib/prisma";

export type SettingValue = string | number | boolean | null | Record<string, unknown> | unknown[];

const DEFAULTS: Record<string, SettingValue> = {
  announcementText: "SAME-DAY NAIROBI DELIVERY - COUNTRYWIDE DELIVERY - SECURE M-PESA CHECKOUT",
  freeShippingThreshold: 0,
  contactPhone: "+254711436169",
  contactEmail: "felixsimon877@gmail.com",
  heroTitle: "GIFTS THAT SAY MORE.",
  heroSubtitle: "Thoughtfully chosen gifts, personalized for the people who matter.",
  corporateEmail: "felixsimon877@gmail.com",
  maintenanceMode: false,
  storeName: "ZED GIFT SHOP 2",
  storeTagline: "Premium gifts, personalized for every occasion.",
  footerDescription: "Premium gifts, personalized keepsakes and corporate gifting, delivered across Kenya.",
  address: "Nairobi, Kenya",
  hours: "Mon-Sat: 8:00 AM - 6:00 PM",
  mapsHref: "https://maps.google.com/",
  mapsEmbed: "",
  whatsappNumber: "254711436169",
  primaryColor: "#E5397F",
  secondaryColor: "#6B2D5C",
  accentColor: "#7C3AED",
  backgroundColor: "#FFFFFF",
};

export async function getSetting(key: string): Promise<SettingValue> {
  try {
    const row = await prisma.adminSetting.findUnique({ where: { key } });
    if (!row) return DEFAULTS[key] ?? null;
    try {
      return JSON.parse(row.value) as SettingValue;
    } catch {
      return row.value;
    }
  } catch {
    return DEFAULTS[key] ?? null;
  }
}

export async function getSettings(): Promise<Record<string, SettingValue>> {
  try {
    const rows = await prisma.adminSetting.findMany();
    const loaded: Record<string, SettingValue> = { ...DEFAULTS };
    for (const row of rows) {
      try {
        loaded[row.key] = JSON.parse(row.value) as SettingValue;
      } catch {
        loaded[row.key] = row.value;
      }
    }
    return loaded;
  } catch {
    return { ...DEFAULTS };
  }
}

export async function setSetting(key: string, value: SettingValue, updatedBy?: string) {
  await prisma.adminSetting.upsert({
    where: { key },
    update: { value: JSON.stringify(value), updatedBy },
    create: { key, value: JSON.stringify(value), updatedBy },
  });
}
