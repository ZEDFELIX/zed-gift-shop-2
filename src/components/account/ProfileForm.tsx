"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, LogOut } from "lucide-react";

export function ProfileForm({ name, email, phone }: { name: string; email: string; phone: string | null }) {
 const router = useRouter();
 const [form, setForm] = useState({ name, email, phone: phone ?? "" });
 const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
 const [error, setError] = useState<string | null>(null);

 async function submit(e: React.FormEvent) {
 e.preventDefault();
 setStatus("saving");
 setError(null);
 const res = await fetch("/api/account/profile", {
 method: "PATCH",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(form),
 });
 const data = (await res.json()) as { error?: string; user?: { name: string; email: string; phone: string | null } };
 if (!res.ok || !data.user) {
 setError(data.error ?? "Couldn't update your profile.");
 setStatus("error");
 return;
 }
 setForm({ name: data.user.name, email: data.user.email, phone: data.user.phone ?? "" });
 setStatus("saved");
 router.refresh();
 }

 return (
 <form onSubmit={submit} className="glass-card space-y-4 rounded-zed p-6">
 <h2 className="font-display text-lg font-bold text-[#171717]">Profile</h2>
 <div className="grid gap-4 sm:grid-cols-2">
 <div>
 <label className="label" htmlFor="p-name">Full name</label>
 <input id="p-name" className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
 </div>
 <div>
 <label className="label" htmlFor="p-phone">Phone (2547...)</label>
 <input id="p-phone" className="field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="tel" />
 </div>
 <div className="sm:col-span-2">
 <label className="label" htmlFor="p-email">Email</label>
 <input id="p-email" type="email" className="field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
 </div>
 </div>
 {status === "error" && <p className="rounded-zed bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
 {status === "saved" && <p className="rounded-zed bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Profile updated.</p>}
 <button type="submit" disabled={status === "saving"} className="flex items-center gap-2 rounded-zed bg-zed-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
 {status === "saving" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Save changes
 </button>
 </form>
 );
}