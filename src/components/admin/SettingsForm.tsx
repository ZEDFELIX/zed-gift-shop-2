"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

type SettingsShape = {
 announcementText: string;
 freeShippingThreshold: number;
 contactPhone: string;
 contactEmail: string;
 heroTitle: string;
 heroSubtitle: string;
 corporateEmail: string;
 maintenanceMode: boolean;
 storeName: string;
 storeTagline: string;
 footerDescription: string;
 address: string;
 hours: string;
 mapsHref: string;
 mapsEmbed: string;
 whatsappNumber: string;
 primaryColor: string;
 secondaryColor: string;
 accentColor: string;
 backgroundColor: string;
};

export function SettingsForm({ initial }: { initial: SettingsShape }) {
 const router = useRouter();
 const [form, setForm] = useState<SettingsShape>(initial);
 const [busy, setBusy] = useState(false);
 const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
 const [error, setError] = useState<string | null>(null);

 async function save(e: React.FormEvent) {
 e.preventDefault();
 setBusy(true);
 setStatus("idle");
 setError(null);
 const res = await fetch("/api/admin/settings", {
 method: "PATCH",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ settings: form }),
 });
 const data = (await res.json()) as { error?: string };
 if (!res.ok) {
 setError(data.error ?? "Couldn't save settings.");
 setStatus("error");
 setBusy(false);
 return;
 }
 setStatus("saved");
 setBusy(false);
 router.refresh();
 }

 function set<K extends keyof SettingsShape>(key: K, value: SettingsShape[K]) {
 setForm((f) => ({ ...f, [key]: value }));
 }

 return (
 <form onSubmit={save} className="space-y-4 rounded-zed border border-edge bg-white p-6">
 <h2 className="font-display text-lg font-bold text-[#07111F]">Store settings</h2>
 <p className="text-sm text-[#334155]">These power the announcement bar, hero and contact details sitewide.</p>

 <div>
 <label className="label" htmlFor="st-announce">Announcement bar text</label>
 <input id="st-announce" className="field" value={form.announcementText} onChange={(e) => set("announcementText", e.target.value)} />
 </div>
 <div className="grid gap-4 sm:grid-cols-2">
 <div>
 <label className="label" htmlFor="st-freeship">Free shipping threshold (KES, 0 = always paid)</label>
 <input id="st-freeship" type="number" min={0} className="field" value={form.freeShippingThreshold} onChange={(e) => set("freeShippingThreshold", Number(e.target.value))} />
 </div>
 <div>
 <label className="label" htmlFor="st-hero">Hero title</label>
 <input id="st-hero" className="field" value={form.heroTitle} onChange={(e) => set("heroTitle", e.target.value)} />
 </div>
 <div>
 <label className="label" htmlFor="st-hero-sub">Hero subtitle</label>
 <input id="st-hero-sub" className="field" value={form.heroSubtitle} onChange={(e) => set("heroSubtitle", e.target.value)} />
 </div>
 <div>
 <label className="label" htmlFor="st-phone">Contact phone</label>
 <input id="st-phone" className="field" value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
 </div>
 <div>
 <label className="label" htmlFor="st-email">Contact email</label>
 <input id="st-email" type="email" className="field" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
 </div>
 <div>
 <label className="label" htmlFor="st-corp">Corporate email</label>
 <input id="st-corp" type="email" className="field" value={form.corporateEmail} onChange={(e) => set("corporateEmail", e.target.value)} />
 </div>
 </div>
 <label className="flex items-center gap-2 text-sm text-[#07111F]">
 <input type="checkbox" checked={form.maintenanceMode} onChange={(e) => set("maintenanceMode", e.target.checked)} className="size-4 accent-deep-olive" />
 Maintenance mode (show a closed banner sitewide)
 </label>

 {status === "error" && <p className="rounded-zed bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
 {status === "saved" && <p className="rounded-zed bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Settings saved and live.</p>}

 <button type="submit" disabled={busy} className="flex items-center gap-2 rounded-zed bg-zed-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
 {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save settings
 </button>
 </form>
 );
 return (
 <form onSubmit={save} className="space-y-6">
  <section className="rounded-zed border border-edge bg-white p-6">
   <div className="mb-5">
    <h2 className="font-display text-xl font-bold text-[#07111F]">Branding</h2>
    <p className="mt-1 text-sm text-[#334155]">Control the store name, tagline and visual identity.</p>
   </div>
   <div className="grid gap-4 sm:grid-cols-2">
    <div><label className="label">Store name</label><input className="field" value={form.storeName} onChange={(e)=>set("storeName",e.target.value)} /></div>
    <div><label className="label">Tagline</label><input className="field" value={form.storeTagline} onChange={(e)=>set("storeTagline",e.target.value)} /></div>
    <div className="sm:col-span-2"><label className="label">Footer description</label><textarea className="field min-h-24 py-3" value={form.footerDescription} onChange={(e)=>set("footerDescription",e.target.value)} /></div>
   </div>
  </section>

  <section className="rounded-zed border border-edge bg-white p-6">
   <div className="mb-5"><h2 className="font-display text-xl font-bold text-[#07111F]">Storefront colours</h2><p className="mt-1 text-sm text-[#334155]">Changes apply across the storefront after saving.</p></div>
   <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <div><label className="label">Primary color</label><div className="flex gap-2"><input type="color" value={form.primaryColor} onChange={(e)=>set("primaryColor",e.target.value)} className="h-11 w-14 rounded-md border border-edge bg-white p-1" /><input className="field" value={form.primaryColor} onChange={(e)=>set("primaryColor",e.target.value)} pattern="^#[0-9A-Fa-f]{6}$" /></div></div>
    <div><label className="label">Secondary color</label><div className="flex gap-2"><input type="color" value={form.secondaryColor} onChange={(e)=>set("secondaryColor",e.target.value)} className="h-11 w-14 rounded-md border border-edge bg-white p-1" /><input className="field" value={form.secondaryColor} onChange={(e)=>set("secondaryColor",e.target.value)} pattern="^#[0-9A-Fa-f]{6}$" /></div></div>
    <div><label className="label">Accent color</label><div className="flex gap-2"><input type="color" value={form.accentColor} onChange={(e)=>set("accentColor",e.target.value)} className="h-11 w-14 rounded-md border border-edge bg-white p-1" /><input className="field" value={form.accentColor} onChange={(e)=>set("accentColor",e.target.value)} pattern="^#[0-9A-Fa-f]{6}$" /></div></div>
    <div><label className="label">Background color</label><div className="flex gap-2"><input type="color" value={form.backgroundColor} onChange={(e)=>set("backgroundColor",e.target.value)} className="h-11 w-14 rounded-md border border-edge bg-white p-1" /><input className="field" value={form.backgroundColor} onChange={(e)=>set("backgroundColor",e.target.value)} pattern="^#[0-9A-Fa-f]{6}$" /></div></div>
   </div>
  </section>

  <section className="rounded-zed border border-edge bg-white p-6">
   <div className="mb-5"><h2 className="font-display text-xl font-bold text-[#07111F]">Store content</h2><p className="mt-1 text-sm text-[#334155]">Edit the main customer-facing text and contact details.</p></div>
   <div className="grid gap-4 sm:grid-cols-2">
    <div className="sm:col-span-2"><label className="label">Announcement bar</label><input className="field" value={form.announcementText} onChange={(e)=>set("announcementText",e.target.value)} /></div>
    <div><label className="label">Hero title</label><input className="field" value={form.heroTitle} onChange={(e)=>set("heroTitle",e.target.value)} /></div>
    <div><label className="label">Hero subtitle</label><input className="field" value={form.heroSubtitle} onChange={(e)=>set("heroSubtitle",e.target.value)} /></div>
    <div><label className="label">Contact phone</label><input className="field" value={form.contactPhone} onChange={(e)=>set("contactPhone",e.target.value)} /></div>
    <div><label className="label">WhatsApp number</label><input className="field" value={form.whatsappNumber} onChange={(e)=>set("whatsappNumber",e.target.value)} /></div>
    <div><label className="label">Contact email</label><input className="field" value={form.contactEmail} onChange={(e)=>set("contactEmail",e.target.value)} /></div>
    <div><label className="label">Corporate email</label><input className="field" value={form.corporateEmail} onChange={(e)=>set("corporateEmail",e.target.value)} /></div>
    <div><label className="label">Address</label><input className="field" value={form.address} onChange={(e)=>set("address",e.target.value)} /></div>
    <div><label className="label">Business hours</label><input className="field" value={form.hours} onChange={(e)=>set("hours",e.target.value)} /></div>
    <div><label className="label">Maps link</label><input className="field" value={form.mapsHref} onChange={(e)=>set("mapsHref",e.target.value)} /></div>
    <div><label className="label">Maps embed URL</label><input className="field" value={form.mapsEmbed} onChange={(e)=>set("mapsEmbed",e.target.value)} /></div>
    <div><label className="label">Free shipping threshold (KES)</label><input type="number" min={0} className="field" value={form.freeShippingThreshold} onChange={(e)=>set("freeShippingThreshold",Number(e.target.value))} /></div>
   </div>
  </section>

  <section className="rounded-zed border border-edge bg-white p-6">
   <label className="flex items-center gap-3 text-sm font-medium text-[#07111F]">
    <input type="checkbox" checked={form.maintenanceMode} onChange={(e)=>set("maintenanceMode",e.target.checked)} className="size-4 accent-deep-olive" />
    Maintenance mode
   </label>
  </section>

  {status === "error" && <p className="rounded-zed bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
  {status === "saved" && <p className="rounded-zed bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Settings saved.</p>}
  <button type="submit" disabled={busy} className="flex items-center gap-2 rounded-zed bg-zed-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
   {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save changes
  </button>
 </form>
 );
}