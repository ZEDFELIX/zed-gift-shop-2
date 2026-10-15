"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil } from "lucide-react";

export function CustomerProfileControl({
  customerId,
  initialName,
  initialPhone,
}: {
  customerId: string;
  initialName: string;
  initialPhone: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/customers/${customerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), phone: phone.trim() || null }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Couldn't save customer details.");
      setBusy(false);
      return;
    }
    setBusy(false);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-1.5 rounded-zed border border-edge px-3 py-1.5 text-xs font-semibold text-[#07111F] hover:border-soft-sage"
      >
        <Pencil className="size-3.5" /> Edit details
      </button>
    );
  }

  return (
    <form onSubmit={save} className="mt-3 space-y-3 rounded-zed border border-edge bg-white/60 p-3">
      <div>
        <label className="label" htmlFor="cc-name">Full name</label>
        <input id="cc-name" className="field" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
      </div>
      <div>
        <label className="label" htmlFor="cc-phone">Phone</label>
        <input id="cc-phone" className="field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254..." />
      </div>
      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="flex items-center gap-1.5 rounded-zed bg-zed-950 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : null} Save
        </button>
        <button type="button" onClick={() => { setOpen(false); setName(initialName); setPhone(initialPhone); setError(null); }} className="rounded-zed border border-edge px-4 py-2 text-xs font-semibold text-[#07111F]">
          Cancel
        </button>
      </div>
    </form>
  );
}
