import "server-only";

import { prisma } from "@/lib/prisma";

export type SettingValue = string | number | boolean | null | Record<string, unknown> | unknown[];

export const DEFAULTS: Record<string, SettingValue> = {
  announcementText: "SAME-DAY NAIROBI DELIVERY - COUNTRYWIDE DELIVERY - SECURE M-PESA CHECKOUT",
  announcementBar: "",
  customerReviews: [
    {
      name: "Wanjiku M.",
      location: "Nairobi",
      rating: 5,
      text: "The personalized hamper was perfect. Same-day delivery arrived before noon and the packaging looked premium.",
    },
    {
      name: "Brian O.",
      location: "Kisumu",
      rating: 5,
      text: "Ordered a trophy set for our team. Quality was better than the photos and it came well protected.",
    },
    {
      name: "Achieng O.",
      location: "Mombasa",
      rating: 4,
      text: "Beautiful packaging and we got updates on WhatsApp at every step until delivery.",
    },
    {
      name: "Peter K.",
      location: "Nakuru",
      rating: 5,
      text: "Corporate gifting for 30 staff done in two days. Smooth process, will definitely order again.",
    },
  ],
  contactPhone: "+254711436169",
  contactEmail: "felixsimon877@gmail.com",
  heroTitle: "GIFTS THAT SAY MORE.",
  heroSubtitle: "Thoughtfully chosen gifts, personalized for the people who matter.",
  corporateEmail: "felixsimon877@gmail.com",
  maintenanceMode: false,
  storeName: "ZED GIFT SHOP",
  storeTagline: "Premium gifts, personalized for every occasion.",
  footerDescription: "Premium gifts, personalized keepsakes and corporate gifting, delivered across Kenya.",
  address: "Nairobi, Kenya",
  hours: "Mon – Sun, 08:00 – 19:00",
  mapsHref: "https://maps.google.com/",
  mapsEmbed: "",
  whatsappNumber: "254711436169",
  primaryColor: "#E5397F",
  secondaryColor: "#6B2D5C",
  accentColor: "#7C3AED",
  backgroundColor: "#FFFFFF",
  returnPolicy: "Returns accepted within 30 days of delivery for unworn and undamaged items with original receipt.",
  newsletterEmail: "info@zedgiftshop2.com",
  copyrightText: "Copyright &copy; {year} {storeName}, All rights reserved.",
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
