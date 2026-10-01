"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Truck } from "lucide-react";
import { formatKES } from "@/lib/utils";
import { KENYA_COUNTIES } from "@/lib/constants";

type Zone = {
 id: string;
 county: string;
 town: string | null;
 fee: number;
 deliveryTime: string | null;
 sameDay: boolean;
 nextDay: boolean;
 pickup: boolean;
 active: boolean;
};

const empty = { county: "", town: "", fee: 0, deliveryTime: "", sameDay: false, nextDay: true, pickup: false, active: true };

export function DeliveriesManager() {
 const [zones, setZones] = useState<Zone[]>([]);
 const [loading, setLoading] = useState(true);
 const [showForm, setShowForm] = useState(false);
 const [form, setForm] = useState(empty);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const load = useCallback(async () => {
 const res = await fetch("/api/admin/deliveries");
 if (res.ok) {
 const data = (await res.json()) as { zones: Zone[] };
 setZones(data.zones);
 }
 setLoading(false);
 }, []);

 useEffect(() => {
 load();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);

 async function create(e: React.FormEvent) {
 e.preventDefault();
 setBusy(true);
 setError(null);
 const res = await fetch("/api/admin/deliveries", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(form),
 });
 const data = (await res.json()) as { error?: string };
 if (!res.ok) {
 setError(data.error ?? "Couldn't create the zone.");
 setBusy(false);
 return;
 }
 setForm(empty);
 setShowForm(false);
 setBusy(false);
 await load();
 }

 async function toggleActive(z: Zone) {
 await fetch(`/api/admin/deliveries/${z.id}`, {
 method: "PATCH",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ active: !z.active }),
 });
 await load();
 }

 async function remove(id: string) {
 await fetch(`/api/admin/deliveries/${id}`, { method: "DELETE" });
 await load();
 }

 const grouped = zones.reduce<Record<string, Zone[]>>((acc, z) => {
 (acc[z.county] ??= []).push(z);
 return acc;
 }, {});

 return (
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <p className="text-sm text-[#334155]">{Object.keys(grouped).length} counties covered</p>
 <button type="button" onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5 rounded-zed bg-zed-950 px-4 py-2.5 text-sm font-bold text-white">
 <Plus className="size-4" /> {showForm ? "Cancel" : "Add zone"}
 </button>
 </div>

 {loading && <p className="flex items-center gap-2 text-sm text-[#334155]"><Loader2 className="size-4 animate-spin" /> Loading...</p>}

 {showForm && (
 <form onSubmit={create} className="grid gap-4 rounded-zed border border-edge bg-white p-5 sm:grid-cols-2">
 <div>
 <label className="label" htmlFor="dz-county">County</label>
 <select id="dz-county" className="field" value={form.county} onChange={(e) => setForm({ ...form, county: e.target.value })} required>
 <option value="">Select county</option>
 {KENYA_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
 </select>
 </div>
 <div>
 <label className="label" htmlFor="dz-town">Town (optional, blank = whole county)</label>
 <input id="dz-town" className="field" value={form.town} onChange={(e) => setForm({ ...form, town: e.target.value })} />
 </div>
 <div>
 <label className="label" htmlFor="dz-fee">Delivery fee (KES)</label>
 <input id="dz-fee" type="number" min={0} className="field" value={form.fee} onChange={(e) => setForm({ ...form, fee: Number(e.target.value) })} required />
 </div>
 <div>
 <label className="label" htmlFor="dz-time">Delivery time label</label>
 <input id="dz-time" className="field" placeholder="1-3 business days" value={form.deliveryTime} onChange={(e) => setForm({ ...form, deliveryTime: e.target.value })} />
 </div>
 <div className="flex gap-4 sm:col-span-2">
 {([["sameDay", "Same-day"], ["nextDay", "Next-day"], ["pickup", "Pickup"]] as const).map(([key, label]) => (
 <label key={key} className="flex items-center gap-2 text-sm text-[#07111F]">
 <input type="checkbox" checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} className="size-4 accent-deep-olive" />
 {label}
 </label>
 ))}
 </div>
 {error && <p className="rounded-zed bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">{error}</p>}
 <button type="submit" disabled={busy} className="rounded-zed bg-zed-950 py-3 text-sm font-bold text-white disabled:opacity-50 sm:col-span-2">
 {busy ? <Loader2 className="mx-auto size-4 animate-spin" /> : "Add zone"}
 </button>
 </form>
 )}

 {Object.keys(grouped).length === 0 && !loading && (
 <div className="rounded-zed border border-dashed border-edge p-10 text-center text-sm text-[#334155]">
 <Truck className="mx-auto mb-2 size-8 text-soft-sage/50" /> No delivery zones yet - add at least Nairobi for same-day.
 </div>
 )}

 <ul className="space-y-3">
 {Object.entries(grouped).map(([county, list]) => (
 <li key={county} className="rounded-zed border border-edge bg-white p-4">
 <p className="font-bold text-[#07111F]">{county}</p>
 <ul className="mt-2 divide-y divide-edge">
 {list.map((z) => (
 <li key={z.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
 <div>
 <p className="font-medium text-[#07111F]">{z.town ?? "Whole county"}
 <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${z.active ? "bg-emerald-50 text-emerald-700" : "bg-panel text-[#334155]"}`}>{z.active ? "Active" : "Paused"}</span>
 </p>
 <p className="text-xs text-[#334155]">
 {[z.sameDay && "Same-day", z.nextDay && "Next-day", z.pickup && "Pickup"].filter(Boolean).join(" | ") || "-"}
 {z.deliveryTime ? ` | ${z.deliveryTime}` : ""}
 </p>
 </div>
 <div className="flex items-center gap-2">
 <p className="font-bold text-[#07111F]">{z.fee === 0 ? "Free" : formatKES(z.fee)}</p>
 <button type="button" onClick={() => toggleActive(z)} className="rounded-zed border border-edge px-3 py-1.5 text-xs font-semibold text-[#07111F] hover:border-soft-sage">{z.active ? "Pause" : "Activate"}</button>
 <button type="button" onClick={() => remove(z.id)} className="rounded-zed border border-red-100 p-1.5 text-red-500 hover:bg-red-50" aria-label="Delete zone">
 <Trash2 className="size-4" />
 </button>
 </div>
 </li>
 ))}
 </ul>
 </li>
 ))}
 </ul>
 </div>
 );
}