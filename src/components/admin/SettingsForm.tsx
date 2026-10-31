"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

type SettingsShape = {
  announcementBar: string;
  announcementColor: string;
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
  returnPolicy: string;
  newsletterEmail: string;
  copyrightText: string;
};

export function SettingsForm({ initial }: { initial: SettingsShape }) {
 const router = useRouter();
 const [form, setForm] = useState<SettingsShape>(initial);
 const [busy, setBusy] = useState(false);
 const [announcementBusy, setAnnouncementBusy] = useState(false);
 const [announcementStatus, setAnnouncementStatus] = useState<"idle" | "saved" | "error">("idle");
 const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
 const [error, setError] = useState<string | null>(null);

 async function saveAnnouncement() {
  setAnnouncementBusy(true);
  setAnnouncementStatus("idle");
  setError(null);
  try {
   const res = await fetch("/api/admin/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ settings: {
      announcementBar: form.announcementBar,
      announcementColor: form.announcementColor,
    }}),
   });
   const data = (await res.json()) as { error?: string };
   if (!res.ok) {
    setError(data.error ?? "Couldn't save the announcement bar.");
    setAnnouncementStatus("error");
    return;
   }
   setAnnouncementStatus("saved");
   router.refresh();
  } catch {
   setError("Network error. Please try again.");
   setAnnouncementStatus("error");
  } finally {
   setAnnouncementBusy(false);
  }
 }

 async function save(e: React.FormEvent) {
  e.preventDefault();
  setBusy(true);
  setStatus("idle");
  setError(null);
  try {
   const res = await fetch("/api/admin/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ settings: form }),
   });
   const data = (await res.json()) as { error?: string };
   if (!res.ok) {
    setError(data.error ?? "Couldn't save settings.");
    setStatus("error");
    return;
   }
   setStatus("saved");
   router.refresh();
  } catch {
   setError("Network error. Please try again.");
   setStatus("error");
  } finally {
   setBusy(false);
  }
 }

 function set<K extends keyof SettingsShape>(key: K, value: SettingsShape[K]) {
  setForm((f) => ({ ...f, [key]: value }));
 }

 return (
  <form onSubmit={save} className="space-y-6">
   <section className="rounded-zed border border-edge bg-white p-6">
    <h2 className="font-display text-xl font-bold text-[#07111F]">Branding</h2>
    <p className="mt-1 text-sm text-[#334155]">Store identity and footer content.</p>
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
     <div><label className="label">Store name</label><input className="field" value={form.storeName} onChange={(e)=>set("storeName",e.target.value)} /></div>
     <div><label className="label">Tagline</label><input className="field" value={form.storeTagline} onChange={(e)=>set("storeTagline",e.target.value)} /></div>
     <div className="sm:col-span-2"><label className="label">Footer description</label><textarea className="field min-h-24 py-3" value={form.footerDescription} onChange={(e)=>set("footerDescription",e.target.value)} /></div>
     </div>
    </section>

    <section className="rounded-zed border border-edge bg-white p-6">
     <h2 className="font-display text-xl font-bold text-[#07111F]">Phone numbers</h2>
     <p className="mt-1 text-sm text-[#334155]">The call number in the header, footer and policies, and the WhatsApp number for chats and order buttons. Use international format starting with 254.</p>
     <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <div><label className="label">Call phone</label><input className="field" value={form.contactPhone} onChange={(e)=>set("contactPhone",e.target.value)} placeholder="+254..." /></div>
      <div><label className="label">WhatsApp number</label><input className="field" value={form.whatsappNumber} onChange={(e)=>set("whatsappNumber",e.target.value)} placeholder="254..." /></div>
     </div>
    </section>

   <section className="rounded-zed border border-edge bg-white p-6">
    <h2 className="font-display text-xl font-bold text-[#07111F]">Store content</h2>
    <p className="mt-1 text-sm text-[#334155]">Edit the customer-facing text and contact details.</p>
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
     <div className="sm:col-span-2 rounded-xl border border-[#eadfe8] bg-[#fbf8fa] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
       <div><h3 className="text-sm font-bold text-[#07111F]">Announcement bar</h3><p className="mt-0.5 text-xs text-[#64748b]">Edit the message and background colour shown at the top of the shop.</p></div>
       <button type="button" onClick={saveAnnouncement} disabled={announcementBusy} className="inline-flex items-center gap-2 rounded-lg bg-zed-950 px-3.5 py-2 text-xs font-bold text-white disabled:opacity-50">
        {announcementBusy ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />} Save announcement
       </button>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px]">
       <div><label className="label">Announcement message</label><input className="field" value={form.announcementBar} onChange={(e)=>{set("announcementBar",e.target.value);setAnnouncementStatus("idle");}} placeholder="Leave blank to hide the message" /></div>
       <div><label className="label">Bar background</label><div className="flex h-10 items-center gap-2 rounded-lg border border-[#d8dce2] bg-white px-2"><input aria-label="Announcement bar background colour" type="color" value={/^#[0-9a-fA-F]{6}$/.test(form.announcementColor) ? form.announcementColor : "#6B2D5C"} onChange={(e)=>{set("announcementColor",e.target.value);setAnnouncementStatus("idle");}} className="size-7 cursor-pointer rounded border-0 bg-transparent p-0" /><span className="text-xs font-medium text-[#475569]">{form.announcementColor}</span></div></div>
      </div>
      <div className="mt-3 overflow-hidden rounded-lg border border-black/10">
       <div className="px-3 py-2 text-center text-xs font-semibold" style={{backgroundColor:form.announcementColor,color:(()=>{const h=form.announcementColor.replace("#","");const n=parseInt(h,16);const l=(0.299*((n>>16)&255)+0.587*((n>>8)&255)+0.114*(n&255))/255;return l>0.6?"#07111F":"#FFFFFF";})()}}>{form.announcementBar.trim() || "Your announcement will appear here"}</div>
      </div>
      {announcementStatus === "saved" && <p className="mt-2 text-xs font-semibold text-emerald-700">Announcement bar saved successfully.</p>}
      {announcementStatus === "error" && <p className="mt-2 text-xs font-semibold text-red-700">{error}</p>}
     </div>
     <div><label className="label">Hero title</label><input className="field" value={form.heroTitle} onChange={(e)=>set("heroTitle",e.target.value)} /></div>
     <div><label className="label">Hero subtitle</label><input className="field" value={form.heroSubtitle} onChange={(e)=>set("heroSubtitle",e.target.value)} /></div>
     <div><label className="label">Contact email</label><input className="field" type="email" value={form.contactEmail} onChange={(e)=>set("contactEmail",e.target.value)} /></div>
     <div><label className="label">Corporate email</label><input className="field" type="email" value={form.corporateEmail} onChange={(e)=>set("corporateEmail",e.target.value)} /></div>
     <div><label className="label">Address</label><input className="field" value={form.address} onChange={(e)=>set("address",e.target.value)} /></div>
     <div><label className="label">Business hours</label><input className="field" value={form.hours} onChange={(e)=>set("hours",e.target.value)} /></div>
     <div><label className="label">Maps link</label><input className="field" value={form.mapsHref} onChange={(e)=>set("mapsHref",e.target.value)} /></div>
     <div><label className="label">Maps embed URL</label><input className="field" value={form.mapsEmbed} onChange={(e)=>set("mapsEmbed",e.target.value)} /></div>
     <div className="sm:col-span-2"><label className="label">Return policy</label><textarea className="field min-h-24 py-3" value={form.returnPolicy} onChange={(e)=>set("returnPolicy",e.target.value)} /></div>
     <div><label className="label">Newsletter email</label><input className="field" type="email" value={form.newsletterEmail} onChange={(e)=>set("newsletterEmail",e.target.value)} /></div>
     <div className="sm:col-span-2"><label className="label">Copyright text</label><input className="field" value={form.copyrightText} onChange={(e)=>set("copyrightText",e.target.value)} /></div>
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
