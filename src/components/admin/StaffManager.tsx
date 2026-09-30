"use client";

import { useState } from "react";
import { Loader2, Plus, ShieldCheck } from "lucide-react";

type StaffRow = { id: string; name: string; email: string; role: "STAFF" | "ADMIN"; createdAt: string };

export function StaffManager({ staff, canAdd }: { staff: StaffRow[]; canAdd: boolean }) {
 const [showForm, setShowForm] = useState(false);
 const [form, setForm] = useState({ name: "", email: "", password: "" });
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState<string | null>(null);

 async function create(e: React.FormEvent) {
 e.preventDefault();
 setBusy(true);
 setError(null);
 const res = await fetch("/api/admin/staff", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(form),
 });
 const data = (await res.json()) as { error?: string };
 if (!res.ok) {
 setError(data.error ?? "Couldn't add staff.");
 setBusy(false);
 return;
 }
 setForm({ name: "", email: "", password: "" });
 setShowForm(false);
 setBusy(false);
 window.location.reload();
 }

 return (
 <div className="space-y-4">
 {canAdd && (
 <div className="flex items-center justify-between">
 <p className="text-sm text-[#6B6B6B]">{staff.length} teammate{staff.length === 1 ? "" : "s"}</p>
 <button type="button" onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5 rounded-zed bg-zed-950 px-4 py-2.5 text-sm font-bold text-white">
 <Plus className="size-4" /> {showForm ? "Cancel" : "Add staff"}
 </button>
 </div>
 )}

 {showForm && canAdd && (
 <form onSubmit={create} className="grid gap-4 rounded-zed border border-edge bg-white p-5 sm:grid-cols-2">
 <div>
 <label className="label" htmlFor="sf-name">Full name</label>
 <input id="sf-name" className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
 </div>
 <div>
 <label className="label" htmlFor="sf-email">Email</label>
 <input id="sf-email" type="email" className="field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
 </div>
 <div className="sm:col-span-2">
 <label className="label" htmlFor="sf-password">Temporary password (give it to them securely)</label>
 <input id="sf-password" type="password" className="field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
 </div>
 {error && <p className="rounded-zed bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">{error}</p>}
 <button type="submit" disabled={busy} className="rounded-zed bg-zed-950 py-3 text-sm font-bold text-white disabled:opacity-50 sm:col-span-2">
 {busy ? <Loader2 className="mx-auto size-4 animate-spin" /> : "Add staff"}
 </button>
 </form>
 )}

 <ul className="space-y-3">
 {staff.map((s) => (
 <li key={s.id} className="flex items-center justify-between rounded-zed border border-edge bg-white p-5">
 <div className="flex items-center gap-3">
 <span className="grid size-10 place-items-center rounded-full bg-warm-white text-deep-olive">
 <ShieldCheck className="size-5" />
 </span>
 <div>
 <p className="font-semibold text-[#171717]">
 {s.name}
 <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${s.role === "ADMIN" ? "bg-zed-950 text-white" : "bg-warm-white text-deep-olive"}`}>{s.role}</span>
 </p>
 <p className="text-sm text-[#6B6B6B]">{s.email} | joined {new Date(s.createdAt).toLocaleDateString("en-KE")}</p>
 </div>
 </div>
 </li>
 ))}
 </ul>
 </div>
 );
}