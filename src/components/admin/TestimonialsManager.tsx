"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import type { CustomerReview } from "@/components/shop/CustomerReviews";

type Props = { initial: CustomerReview[] };

export function TestimonialsManager({ initial }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<CustomerReview[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function set(index: number, patch: Partial<CustomerReview>) {
    setRows((current) => current.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function remove(index: number) {
    setRows((current) => current.filter((_, i) => i !== index));
  }

  function add() {
    setRows((current) => [...current, { name: "", location: "", rating: 5, text: "" }]);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: { customerReviews: rows } }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Couldn't save reviews.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="rounded-zed border border-edge bg-white p-6">
        <h2 className="font-display text-xl font-bold text-[#07111F]">Customer reviews</h2>
        <p className="mt-1 text-sm text-[#334155]">
          These show in the reviews section at the bottom of the shop page. Leave the name or text
          empty and the review is dropped. Delete a review with the trash button, or add a new one
          below.
        </p>
      </div>

      {rows.map((row, index) => (
        <div key={index} className="rounded-zed border border-edge bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label">Customer name</label>
              <input
                className="field"
                value={row.name}
                onChange={(e) => set(index, { name: e.target.value })}
                placeholder="Wanjiku M."
              />
            </div>
            <div>
              <label className="label">Location</label>
              <input
                className="field"
                value={row.location}
                onChange={(e) => set(index, { location: e.target.value })}
                placeholder="Nairobi"
              />
            </div>
            <div>
              <label className="label">Rating</label>
              <select
                className="field"
                value={row.rating}
                onChange={(e) => set(index, { rating: Number(e.target.value) })}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{n} / 5</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3">
            <label className="label">Review</label>
            <textarea
              className="field min-h-20 py-3"
              value={row.text}
              onChange={(e) => set(index, { text: e.target.value })}
              placeholder="What did the customer say?"
            />
          </div>
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => remove(index)}
              className="flex items-center gap-1.5 rounded-md border border-edge px-2.5 py-1.5 text-[11px] font-semibold text-charcoal/60 transition-colors hover:border-rose-300 hover:text-rose-600"
            >
              <Trash2 className="size-3.5" /> Delete
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="flex items-center gap-2 rounded-zed border border-edge bg-white px-4 py-2.5 text-sm font-semibold text-charcoal transition-colors hover:border-rose-300 hover:text-rose-600"
      >
        <Plus className="size-4" /> Add review
      </button>

      {error && <p className="rounded-zed bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {saved && <p className="rounded-zed bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Reviews saved.</p>}

      <button
        type="submit"
        disabled={busy}
        className="flex items-center gap-2 rounded-zed bg-zed-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save reviews
      </button>
    </form>
  );
}
