import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/data/settings";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { PasswordForm } from "@/components/account/PasswordForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings | Admin" };

export default async function AdminSettingsPage() {
  const me = await getCurrentUser();
  const s = await getSettings();
  if (me?.role !== "ADMIN") {
    return (
      <div className="space-y-6">
        <div className="rounded-zed border border-edge bg-white p-6">
          <h2 className="font-display text-xl font-bold text-[#07111F]">Restricted</h2>
          <p className="mt-1 text-sm text-[#334155]">
            Only the store owner can change store settings. You can still update your own sign-in password below.
          </p>
          <Link href="/admin" className="mt-4 inline-block text-sm font-semibold text-soft-sage hover:underline">
            Back to dashboard
          </Link>
        </div>
        <PasswordForm />
      </div>
    );
  }
 return (
 <div className="space-y-6">
 <PasswordForm />
 <SettingsForm
initial={{
  announcementBar: String(s.announcementBar ?? ""),
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
  returnPolicy: String(s.returnPolicy ?? ""),
  newsletterEmail: String(s.newsletterEmail ?? "info@zedgiftshop2.com"),
  copyrightText: String(s.copyrightText ?? "Copyright &copy; {year} {storeName}, All rights reserved."),
}}
  />
  </div>
  );
}
