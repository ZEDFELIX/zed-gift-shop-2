"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

export function DeleteAccountForm({ email }: { email: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = confirm.trim().toLowerCase() === email.trim().toLowerCase();

  async function onDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!canDelete || busy) return;
    if (!window.confirm("Delete your account permanently? Your orders stay on record, but you won't be able to log in again.")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account/profile", { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Couldn't delete your account.");
        setBusy(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  }

  return (
    <section className="rounded-zed border border-red-200 bg-white p-6">
      <h2 className="flex items-center gap-2 font-display text-xl font-bold text-red-700">
        <Trash2 className="size-5" /> Delete account
      </h2>
      <p className="mt-1 text-sm text-[#334155]">
        Permanently delete your account and sign you out. Your past orders stay on record for receipts and delivery
        tracking, but your profile, addresses, wishlist and reminders are removed.
      </p>
      <form onSubmit={onDelete} className="mt-5 space-y-3">
        <div>
          <label className="label" htmlFor="delete-confirm">
            Type your email (<span className="font-semibold">{email}</span>) to confirm
          </label>
          <input
            id="delete-confirm"
            className="field"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={email}
            autoComplete="off"
          />
        </div>
        {error && <p className="rounded-zed bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={!canDelete || busy}
          className="flex items-center gap-2 rounded-zed bg-red-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Delete my account
        </button>
      </form>
    </section>
  );
}
