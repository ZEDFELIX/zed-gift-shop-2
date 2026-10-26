"use client";

import { useState } from "react";
import { Loader2, Plus, ShieldCheck } from "lucide-react";

type StaffRow = { id: string; name: string; email: string; role: "STAFF" | "ADMIN"; createdAt: string };

export function StaffManager({ staff, canAdd }: { staff: StaffRow[]; canAdd: boolean }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STAFF" as "STAFF" | "ADMIN" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Couldn't add account.");
        setBusy(false);
        return;
      }
      setForm({ name: "", email: "", password: "", role: "STAFF" });
      setShowForm(false);
      window.location.reload();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Are you sure you want to delete this team account?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/staff?id=" + encodeURIComponent(id), { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Couldn't delete account.");
        return;
      }
      window.location.reload();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {canAdd && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-[#334155]">{staff.length} team account{staff.length === 1 ? "" : "s"}</p>
          <button type="button" onClick={() => { setShowForm((s) => !s); setError(null); }} className="flex items-center gap-1.5 rounded-zed bg-zed-950 px-4 py-2.5 text-sm font-bold text-white">
            <Plus className="size-4" /> {showForm ? "Cancel" : "Add account"}
          </button>
        </div>
      )}

      {showForm && canAdd && (
        <form onSubmit={create} className="grid gap-4 rounded-zed border border-edge bg-white p-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="sf-name">Full name</label>
            <input id="sf-name" className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoComplete="name" />
          </div>
          <div>
            <label className="label" htmlFor="sf-email">Email</label>
            <input id="sf-email" type="email" className="field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="email" />
          </div>
          <div>
            <label className="label" htmlFor="sf-role">Account role</label>
            <select id="sf-role" className="field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "STAFF" | "ADMIN" })}>
              <option value="STAFF">Staff — limited admin access</option>
              <option value="ADMIN">Admin — full admin access</option>
            </select>
            <p className="mt-1 text-xs text-[#64748b]">Only grant Admin access to people you trust.</p>
          </div>
          <div>
            <label className="label" htmlFor="sf-password">Temporary password</label>
            <input id="sf-password" type="password" className="field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} maxLength={128} autoComplete="new-password" />
          </div>
          {error && <p className="rounded-zed bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">{error}</p>}
          <button type="submit" disabled={busy} className="rounded-zed bg-zed-950 py-3 text-sm font-bold text-white disabled:opacity-50 sm:col-span-2">
            {busy ? <Loader2 className="mx-auto size-4 animate-spin" /> : form.role === "ADMIN" ? "Create admin account" : "Add staff account"}
          </button>
        </form>
      )}

      {error && !showForm && <p className="rounded-zed bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <ul className="space-y-3">
        {staff.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 rounded-zed border border-edge bg-white p-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-warm-white text-deep-olive">
                <ShieldCheck className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-[#07111F]">
                  {s.name}
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${s.role === "ADMIN" ? "bg-zed-950 text-white" : "bg-warm-white text-deep-olive"}`}>{s.role}</span>
                </p>
                <p className="truncate text-sm text-[#334155]">{s.email} | joined {new Date(s.createdAt).toLocaleDateString("en-KE")}</p>
              </div>
            </div>
            {canAdd && (
              <button type="button" onClick={() => remove(s.id)} disabled={busy} className="shrink-0 rounded-zed border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50">
                Delete
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
