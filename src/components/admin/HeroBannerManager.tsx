"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";

type HeroBanner = { eyebrow: string; title: string; description: string; buttonLabel: string; buttonHref: string; imageUrls: string[] };
const defaults: HeroBanner = { eyebrow: "Thoughtful gifting starts here", title: "Make every moment feel special.", description: "Find a thoughtful gift for the people and moments that matter most.", buttonLabel: "Explore gifts", buttonHref: "/shop?sort=new", imageUrls: ["", "", "", ""] };

export function HeroBannerManager({ initial }: { initial?: Partial<HeroBanner> | null }) {
  const [value, setValue] = useState<HeroBanner>({ ...defaults, ...initial, imageUrls: Array.isArray(initial?.imageUrls) ? [...initial.imageUrls, "", "", "", ""].slice(0, 4) : defaults.imageUrls });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  function update<K extends keyof HeroBanner>(key: K, next: HeroBanner[K]) { setValue(old => ({ ...old, [key]: next })); }
  async function save() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ settings: { shopHeroBanner: value } }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save banner.");
      setMessage("Shop banner saved successfully."); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save banner."); }
    finally { setBusy(false); }
  }
  return <section className="space-y-4 rounded-zed border border-edge bg-white p-6">
    <div><h2 className="font-display text-xl font-bold text-[#07111F]">Shop hero banner</h2><p className="mt-1 text-sm text-[#334155]">Edit the desktop shop banner and its four photos. Paste image URLs from products already uploaded to your shop. Leave a photo blank to use a current catalogue product photo automatically.</p></div>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-xs font-semibold">Small heading<input className="field mt-1" value={value.eyebrow} onChange={e=>update("eyebrow",e.target.value)} /></label>
      <label className="text-xs font-semibold">Main heading<input className="field mt-1" value={value.title} onChange={e=>update("title",e.target.value)} /></label>
      <label className="text-xs font-semibold sm:col-span-2">Description<textarea className="field mt-1 min-h-20" value={value.description} onChange={e=>update("description",e.target.value)} /></label>
      <label className="text-xs font-semibold">Button text<input className="field mt-1" value={value.buttonLabel} onChange={e=>update("buttonLabel",e.target.value)} /></label>
      <label className="text-xs font-semibold">Button link<input className="field mt-1" value={value.buttonHref} onChange={e=>update("buttonHref",e.target.value)} /></label>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      {value.imageUrls.map((url,index)=><label key={index} className="text-xs font-semibold">Banner photo {index+1}<input className="field mt-1" value={url} onChange={e=>update("imageUrls",value.imageUrls.map((x,i)=>i===index?e.target.value:x))} placeholder="Paste an existing product image URL" />{url && <img src={url} alt={`Banner preview ${index+1}`} className="mt-2 h-24 w-full rounded-lg border border-edge object-cover" />}</label>)}
    </div>
    <div className="flex flex-wrap items-center gap-3"><button type="button" disabled={busy} onClick={save} className="inline-flex items-center gap-2 rounded-zed bg-zed-950 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><Save className="size-4"/>{busy?"Saving...":"Save banner"}</button>{message && <p className="text-sm text-[#334155]">{message}</p>}</div>
  </section>;
}
