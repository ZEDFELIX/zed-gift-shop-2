"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, MapPin, Plus, Star, Trash2 } from "lucide-react";
import { KENYA_COUNTIES } from "@/lib/constants";

type Address = {
 id: string;
 label: string | null;
 fullName: string;
 phone: string;
 county: string;
 town: string;
 address: string;
 building: string | null;
 apartment: string | null;
 isDefault: boolean;
};

const empty = { label: "", county: "", town: "", address: "", building: "", apartment: "", isDefault: false };

export function AddressBook() {
 const router = useRouter();
 const [addresses, setAddresses] = useState<Address[]>([]);
 const [loading, setLoading] = useState(true);
 const [showForm, setShowForm] = useState(false);
 const [form, setForm] = useState(empty);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const load = useCallback(async () => {
 const res = await fetch("/api/account/addresses");
 if (res.ok) {
 const data = (await res.json()) as { addresses: Address[] };
 setAddresses(data.addresses);
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
 const res = await fetch("/api/account/addresses", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(form),
 });
 const data = (await res.json()) as { error?: string };
 if (!res.ok) {
 setError(data.error ?? "Couldn't save the address.");
 setBusy(false);
 return;
 }
 setForm(empty);
 setShowForm(false);
 setBusy(false);
 await load();
 }

 async function remove(id: string) {
 await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
 await load();
 }

 async function setDefault(id: string) {
 await fetch(`/api/account/addresses/${id}`, {
 method: "PATCH",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ isDefault: true }),
 });
 setBusy(false);
 await load();
 router.refresh();
 }

 return (
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <p className="text-sm text-[#334155]">{addresses.length} saved address{addresses.length === 1 ? "" : "es"}</p>
 <button type="button" onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5 rounded-zed bg-zed-950 px-4 py-2.5 text-sm font-bold text-white">
 <Plus className="size-4" /> {showForm ? "Cancel" : "Add address"}
 </button>
 </div>

 {loading && (
 <p className="flex items-center gap-2 text-sm text-[#334155]"><Loader2 className="size-4 animate-spin" /> Loading...</p>
 )}

 {showForm && (
 <form onSubmit={create} className="glass-card grid gap-4 rounded-zed p-5 sm:grid-cols-2">
 <div>
 <label className="label" htmlFor="ad-label">Label</label>
 <input id="ad-label" className="field" placeholder="Home, Office..." value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} maxLength={60} />
 </div>
 <div>
 <label className="label" htmlFor="ad-county">County</label>
 <select id="ad-county" className="field" value={form.county} onChange={(e) => setForm({ ...form, county: e.target.value })} required>
 <option value="">Select county</option>
 {KENYA_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
 </select>
 </div>
 <div>
 <label className="label" htmlFor="ad-town">Town / estate</label>
 <input id="ad-town" className="field" value={form.town} onChange={(e) => setForm({ ...form, town: e.target.value })} required />
 </div>
 <div className="sm:col-span-2">
 <label className="label" htmlFor="ad-address">Street address</label>
 <input id="ad-address" className="field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
 </div>
 <div>
 <label className="label" htmlFor="ad-building">Building (optional)</label>
 <input id="ad-building" className="field" value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} />
 </div>
 <div>
 <label className="label" htmlFor="ad-apartment">Apartment (optional)</label>
 <input id="ad-apartment" className="field" value={form.apartment} onChange={(e) => setForm({ ...form, apartment: e.target.value })} />
 </div>
 <label className="flex items-center gap-2 text-sm text-[#07111F] sm:col-span-2">
 <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="size-4 accent-deep-olive" />
 Make this my default address
 </label>
 {error && <p className="rounded-zed bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">{error}</p>}
 <button type="submit" disabled={busy} className="flex items-center justify-center gap-2 rounded-zed bg-zed-950 py-3 text-sm font-bold text-white disabled:opacity-50 sm:col-span-2">
 {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Save address
 </button>
 </form>
 )}

 {addresses.length === 0 && !loading && (
 <div className="rounded-zed border border-dashed border-edge p-10 text-center text-sm text-[#334155]">
 <MapPin className="mx-auto mb-2 size-8 text-soft-sage/50" />
 No saved addresses yet. Add one to check out faster.
 </div>
 )}

 <ul className="space-y-3">
 {addresses.map((a) => (
 <li key={a.id} className="glass-card rounded-zed p-5">
 <div className="flex flex-wrap items-start justify-between gap-3">
 <div>
 <p className="flex items-center gap-2 font-semibold text-[#07111F]">
 {a.label ?? a.fullName}
 {a.isDefault && <span className="flex items-center gap-1 rounded-full bg-warm-white px-2 py-0.5 text-[11px] font-bold text-deep-olive"><Star className="size-3" /> Default</span>}
 </p>
 <p className="mt-1 text-sm text-[#334155]">{a.address}{a.building ? `, ${a.building}` : ""}{a.apartment ? `, ${a.apartment}` : ""}</p>
 <p className="text-sm text-[#334155]">{a.town}, {a.county}</p>
 </div>
 <div className="flex items-center gap-2">
 {!a.isDefault && (
 <button type="button" onClick={() => setDefault(a.id)} className="rounded-zed border border-edge px-3 py-1.5 text-xs font-semibold text-[#07111F] hover:border-soft-sage">
 Make default
 </button>
 )}
 <button type="button" onClick={() => remove(a.id)} className="rounded-zed border border-red-100 p-2 text-red-500 hover:bg-red-50" aria-label="Delete address">
 <Trash2 className="size-4" />
 </button>
 </div>
 </div>
 </li>
 ))}
 </ul>
 </div>
 );
}