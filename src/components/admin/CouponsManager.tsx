"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Ticket, Trash2 } from "lucide-react";
import { formatKES } from "@/lib/utils";

type Coupon = {
 id: string;
 code: string;
 type: "PERCENTAGE" | "FIXED";
 value: number;
 minSpend: number;
 maxUses: number | null;
 usedCount: number;
 expiresAt: string | null;
 active: boolean;
};

const empty: {
 code: string;
 type: "PERCENTAGE" | "FIXED";
 value: number;
 minSpend: number;
 maxUses: number | null;
 expiresAt: string;
 active: boolean;
} = { code: "", type: "PERCENTAGE", value: 10, minSpend: 0, maxUses: null, expiresAt: "", active: true };

export function CouponsManager() {
 const [coupons, setCoupons] = useState<Coupon[]>([]);
 const [loading, setLoading] = useState(true);
 const [showForm, setShowForm] = useState(false);
 const [form, setForm] = useState(empty);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const load = useCallback(async () => {
 const res = await fetch("/api/admin/coupons");
 if (res.ok) {
 const data = (await res.json()) as { coupons: Coupon[] };
 setCoupons(data.coupons);
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
 const res = await fetch("/api/admin/coupons", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ ...form, maxUses: form.maxUses ? Number(form.maxUses) : null }),
 });
 const data = (await res.json()) as { error?: string };
 if (!res.ok) {
 setError(data.error ?? "Couldn't create the coupon.");
 setBusy(false);
 return;
 }
 setForm(empty);
 setShowForm(false);
 setBusy(false);
 await load();
 }

 async function toggle(c: Coupon) {
 await fetch(`/api/admin/coupons/${c.id}`, {
 method: "PATCH",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ active: !c.active }),
 });
 await load();
 }

 async function remove(id: string) {
 await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
 await load();
 }

 return (
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <p className="text-sm text-[#334155]">Active coupons:{coupons.filter((c) => c.active).length}</p>
 <button type="button" onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5 rounded-zed bg-zed-950 px-4 py-2.5 text-sm font-bold text-white">
 <Plus className="size-4" /> {showForm ? "Cancel" : "New coupon"}
 </button>
 </div>

 {loading && <p className="flex items-center gap-2 text-sm text-[#334155]"><Loader2 className="size-4 animate-spin" /> Loading...</p>}

 {showForm && (
 <form onSubmit={create} className="grid gap-4 rounded-zed border border-edge bg-white p-5 sm:grid-cols-2">
 <div>
 <label className="label" htmlFor="cp-code">Code</label>
 <input id="cp-code" className="field uppercase" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s/g, "") })} required />
 </div>
 <div>
 <label className="label" htmlFor="cp-type">Type</label>
 <select id="cp-type" className="field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "PERCENTAGE" | "FIXED" })}>
 <option value="PERCENTAGE">Percentage (%)</option>
 <option value="FIXED">Fixed amount (KES)</option>
 </select>
 </div>
 <div>
 <label className="label" htmlFor="cp-value">Value</label>
 <input id="cp-value" type="number" min={0} className="field" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} required />
 </div>
 <div>
 <label className="label" htmlFor="cp-min">Min spend (KES)</label>
 <input id="cp-min" type="number" min={0} className="field" value={form.minSpend} onChange={(e) => setForm({ ...form, minSpend: Number(e.target.value) })} />
 </div>
 <div>
 <label className="label" htmlFor="cp-uses">Max uses</label>
 <input id="cp-uses" type="number" min={1} className="field" value={form.maxUses ?? ""} onChange={(e) => setForm({ ...form, maxUses: e.target.value ? Number(e.target.value) : null })} />
 </div>
 <div>
 <label className="label" htmlFor="cp-expires">Expires</label>
 <input id="cp-expires" type="date" className="field" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
 </div>
 {error && <p className="rounded-zed bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">{error}</p>}
 <button type="submit" disabled={busy} className="rounded-zed bg-zed-950 py-3 text-sm font-bold text-white disabled:opacity-50 sm:col-span-2">
 {busy ? <Loader2 className="mx-auto size-4 animate-spin" /> : "Create coupon"}
 </button>
 </form>
 )}

 {coupons.length === 0 && !loading && (
 <div className="rounded-zed border border-dashed border-edge p-10 text-center text-sm text-[#334155]">
 <Ticket className="mx-auto mb-2 size-8 text-soft-sage/50" /> No coupons yet.
 </div>
 )}

 <ul className="space-y-3">
 {coupons.map((c) => (
 <li key={c.id} className="rounded-zed border border-edge bg-white p-5">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div>
 <p className="flex items-center gap-2 font-bold text-[#07111F]">
 {c.code}
 <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${c.active ? "bg-emerald-50 text-emerald-700" : "bg-panel text-[#334155]"}`}>{c.active ? "Active" : "Paused"}</span>
 </p>
 <p className="mt-1 text-sm text-[#334155]">
 {c.type === "PERCENTAGE" ? `${c.value}% off` : `${formatKES(c.value)} off`}
 {c.minSpend > 0 ? ` | min ${formatKES(c.minSpend)}` : ""} | used {c.usedCount}{c.maxUses ? `/${c.maxUses}` : ""}
 {c.expiresAt ? ` | expires ${new Date(c.expiresAt).toLocaleDateString("en-KE")}` : ""}
 </p>
 </div>
 <div className="flex items-center gap-2">
 <button type="button" onClick={() => toggle(c)} className="rounded-zed border border-edge px-3 py-1.5 text-xs font-semibold text-[#07111F] hover:border-soft-sage">
 {c.active ? "Pause" : "Activate"}
 </button>
 <button type="button" onClick={() => remove(c.id)} className="rounded-zed border border-red-100 p-2 text-red-500 hover:bg-red-50" aria-label="Delete coupon">
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