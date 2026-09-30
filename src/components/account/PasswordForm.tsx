"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, LogOut, Save } from "lucide-react";

export function PasswordForm() {
 const router = useRouter();
 const [form, setForm] = useState({ current: "", next: "", confirm: "" });
 const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
 const [error, setError] = useState<string | null>(null);

 async function submit(e: React.FormEvent) {
 e.preventDefault();
 if (form.next !== form.confirm) {
 setStatus("error");
 setError("Passwords don't match.");
 return;
 }
 setStatus("saving");
 setError(null);
 const res = await fetch("/api/account/password", {
 method: "PATCH",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ currentPassword: form.current, newPassword: form.next }),
 });
 const data = (await res.json()) as { error?: string };
 if (!res.ok) {
 setError(data.error ?? "Couldn't change your password.");
 setStatus("error");
 return;
 }
 setForm({ current: "", next: "", confirm: "" });
 setStatus("saved");
 router.refresh();
 }

 async function logout() {
 await fetch("/api/auth/logout", { method: "POST" });
 router.push("/");
 router.refresh();
 }

 return (
 <form onSubmit={submit} className="glass-card space-y-4 rounded-zed p-6">
 <h2 className="font-display text-lg font-bold text-[#171717]">Change password</h2>
 <div className="space-y-4">
 <div>
 <label className="label" htmlFor="pw-current">Current password</label>
 <input id="pw-current" type="password" className="field" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} required autoComplete="current-password" />
 </div>
 <div className="grid gap-4 sm:grid-cols-2">
 <div>
 <label className="label" htmlFor="pw-next">New password</label>
 <input id="pw-next" type="password" className="field" value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} required minLength={8} autoComplete="new-password" />
 </div>
 <div>
 <label className="label" htmlFor="pw-confirm">Confirm new password</label>
 <input id="pw-confirm" type="password" className="field" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required minLength={8} autoComplete="new-password" />
 </div>
 </div>
 </div>
 {status === "error" && <p className="rounded-zed bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
 {status === "saved" && <p className="rounded-zed bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Password changed.</p>}
 <div className="flex flex-wrap gap-2">
 <button type="submit" disabled={status === "saving"} className="flex items-center gap-2 rounded-zed bg-zed-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
 {status === "saving" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Update password
 </button>
 <button type="button" onClick={logout} className="flex items-center gap-2 rounded-zed border border-edge px-5 py-3 text-sm font-semibold text-[#171717] hover:border-red-200 hover:text-red-600">
 <LogOut className="size-4" /> Log out
 </button>
 </div>
 </form>
 );
}