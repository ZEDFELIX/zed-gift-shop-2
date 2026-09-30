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
 <h2 className="font-display text-lg font-bold text-[#171717]">Store settings</h2>
 <p className="text-sm text-[#6B6B6B]">These power the announcement bar, hero and contact details sitewide.</p>

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
 <label className="flex items-center gap-2 text-sm text-[#171717]">
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
}