import { getSettings } from "@/lib/data/settings";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings | Admin" };

export default async function AdminSettingsPage() {
 const s = await getSettings();
 return (
 <SettingsForm
 initial={{
 announcementText: String(s.announcementText ?? ""),
 freeShippingThreshold: Number(s.freeShippingThreshold ?? 0),
 contactPhone: String(s.contactPhone ?? ""),
 contactEmail: String(s.contactEmail ?? ""),
 heroTitle: String(s.heroTitle ?? ""),
 heroSubtitle: String(s.heroSubtitle ?? ""),
 corporateEmail: String(s.corporateEmail ?? ""),
 maintenanceMode: Boolean(s.maintenanceMode),
 storeName: String(s.storeName ?? ""),
 storeTagline: String(s.storeTagline ?? ""),
 footerDescription: String(s.footerDescription ?? ""),
 address: String(s.address ?? ""),
 hours: String(s.hours ?? ""),
 mapsHref: String(s.mapsHref ?? ""),
 mapsEmbed: String(s.mapsEmbed ?? ""),
 whatsappNumber: String(s.whatsappNumber ?? ""),
 primaryColor: String(s.primaryColor ?? "#E5397F"),
 secondaryColor: String(s.secondaryColor ?? "#6B2D5C"),
 accentColor: String(s.accentColor ?? "#7C3AED"),
 backgroundColor: String(s.backgroundColor ?? "#FFFFFF"),
 }}
 />
 );
}