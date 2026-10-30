"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";

type Carousel = { id: string; title: string; query: string; href: string; backgroundColor: string; titleColor: string; enabled: boolean };
const defaults: Carousel[] = [
  { id: "gift-sets", title: "Gift Sets", query: "gift set", href: "/shop?q=gift%20set", backgroundColor: "#F7EDF4", titleColor: "#6B2D5C", enabled: true },
  { id: "new-arrivals", title: "New arrivals", query: "", href: "/shop?sort=new", backgroundColor: "#FFFFFF", titleColor: "#6B2D5C", enabled: true },
  { id: "popular-gifts", title: "Popular gifts", query: "", href: "/shop?sort=popular", backgroundColor: "#FFFFFF", titleColor: "#6B2D5C", enabled: true },
];
export function CarouselManager({ initial }: { initial: Carousel[] }) {
 const [items,setItems]=useState<Carousel[]>(initial.length?initial:defaults);
 const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");
 const router=useRouter();
 const update=(i:number,key:keyof Carousel,value:string|boolean)=>setItems(old=>old.map((x,n)=>n===i?{...x,[key]:value}:x));
 async function save(){setBusy(true);setMessage("");try{const res=await fetch("/api/admin/settings",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({settings:{carouselSections:items}})});const data=await res.json();if(!res.ok)throw new Error(data.error||"Save failed");setMessage("Carousel settings saved.");router.refresh();}catch(e){setMessage(e instanceof Error?e.message:"Could not save.");}finally{setBusy(false);}}
 return <section className="rounded-zed border border-edge bg-white p-6 space-y-4">
  <div><h2 className="font-display text-xl font-bold text-[#07111F]">Shop carousels</h2><p className="mt-1 text-sm text-[#334155]">Customise every product carousel or add a new one. Use a product search term to choose which existing products appear.</p></div>
  {items.map((item,i)=><div key={item.id} className="rounded-xl border border-edge p-4 space-y-3">
   <div className="flex items-center justify-between"><strong className="text-sm">{item.title||"New carousel"}</strong><button type="button" onClick={()=>setItems(old=>old.filter((_,n)=>n!==i))} className="text-red-600" aria-label="Remove carousel"><Trash2 className="size-4"/></button></div>
   <div className="grid gap-3 sm:grid-cols-2">
    <label className="text-xs font-semibold">Carousel title<input className="field mt-1" value={item.title} onChange={e=>update(i,"title",e.target.value)}/></label>
    <label className="text-xs font-semibold">Product search term<input className="field mt-1" value={item.query} onChange={e=>update(i,"query",e.target.value)} placeholder="e.g. gift set, mug"/></label>
    <label className="text-xs font-semibold">See all link<input className="field mt-1" value={item.href} onChange={e=>update(i,"href",e.target.value)}/></label>
    <label className="text-xs font-semibold">Background colour<input type="color" className="field mt-1 h-11 p-1" value={item.backgroundColor} onChange={e=>update(i,"backgroundColor",e.target.value)}/></label>
    <label className="text-xs font-semibold">Title colour<input type="color" className="field mt-1 h-11 p-1" value={item.titleColor} onChange={e=>update(i,"titleColor",e.target.value)}/></label>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={item.enabled} onChange={e=>update(i,"enabled",e.target.checked)}/>Show this carousel</label>
   </div>
  </div>)}
  <div className="flex flex-wrap gap-2"><button type="button" onClick={()=>setItems(old=>[...old,{id:"carousel-"+Date.now(),title:"New carousel",query:"",href:"/shop",backgroundColor:"#FFFFFF",titleColor:"#6B2D5C",enabled:true}])} className="inline-flex items-center gap-2 rounded-zed border border-edge px-4 py-2 text-sm font-semibold"><Plus className="size-4"/>Add carousel</button><button type="button" disabled={busy} onClick={save} className="inline-flex items-center gap-2 rounded-zed bg-zed-950 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><Save className="size-4"/>{busy?"Saving...":"Save carousels"}</button></div>
  {message&&<p className="text-sm text-[#334155]">{message}</p>}
 </section>;
}
