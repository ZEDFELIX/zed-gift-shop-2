"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { formatKES } from "@/lib/utils";

type Wrap = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  image: string | null;
  description: string | null;
  active: boolean;
  sortOrder: number;
};

const empty = { name: "", sku: "", price: 0, image: "", description: "", active: true, sortOrder: 0 };

export function GiftWrapManager() {
  const [wraps, setWraps] = useState<Wrap[]>([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<Wrap | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/gift-wrap");
    const data = (await res.json()) as { wraps?: Wrap[] };
    setWraps(data.wraps ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const isEdit = Boolean(editing);
    const res = await fetch(isEdit ? `/api/admin/gift-wrap/${editing!.id}` : "/api/admin/gift-wrap", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ?? form),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Couldn't save gift wrap.");
      setBusy(false);
      return;
    }
    setForm(empty);
    setEditing(null);
    setBusy(false);
    await load();
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this gift wrap option? Products using it will fall back to no wrap.")) return;
    const res = await fetch(`/api/admin/gift-wrap/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Couldn't delete gift wrap.");
      return;
    }
    await load();
  }

  async function toggleActive(w: Wrap) {
    const res = await fetch(`/api/admin/gift-wrap/${w.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...w, active: !w.active }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Couldn't update gift wrap.");
      return;
    }
    await load();
  }

  const draft = editing ?? form;
  function setDraft(patch: Partial<typeof empty>) {
    if (editing) setEditing({ ...editing, ...patch } as Wrap);
    else setForm({ ...form, ...patch });
  }

  return (
    <div className="space-y-5">
      {error && <p className="rounded-zed bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <form onSubmit={save} className="grid gap-3 rounded-zed border border-edge bg-white p-5 sm:grid-cols-2">
        <p className="font-display text-lg font-bold text-[#07111F] sm:col-span-2">
          {editing ? "Edit gift wrap" : "Add gift wrap"}
        </p>
        <div>
          <label className="label" htmlFor="gw-name">Name</label>
          <input id="gw-name" className="field" value={draft.name} onChange={(e) => setDraft({ name: e.target.value })} required placeholder="Premium gift box" />
        </div>
        <div>
          <label className="label" htmlFor="gw-price">Price (KES)</label>
          <input id="gw-price" className="field" type="number" min={0} value={draft.price} onChange={(e) => setDraft({ price: Number(e.target.value) })} required />
        </div>
        <div>
          <label className="label" htmlFor="gw-sku">SKU (optional)</label>
          <input id="gw-sku" className="field" value={draft.sku ?? ""} onChange={(e) => setDraft({ sku: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="gw-sort">Sort order</label>
          <input id="gw-sort" className="field" type="number" min={0} value={draft.sortOrder ?? 0} onChange={(e) => setDraft({ sortOrder: Number(e.target.value) })} />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="gw-desc">Description (optional - shown on product page)</label>
          <input id="gw-desc" className="field" value={draft.description ?? ""} onChange={(e) => setDraft({ description: e.target.value })} placeholder="Kraft box with ribbon" />
        </div>
        <label className="flex items-center gap-2 text-sm text-[#07111F]">
          <input type="checkbox" checked={draft.active ?? true} onChange={(e) => setDraft({ active: e.target.checked })} className="size-4 accent-deep-olive" />
          Active (shown on product pages)
        </label>
        <div className="flex gap-2 sm:col-span-2">
          <button type="submit" disabled={busy} className="flex items-center gap-2 rounded-zed bg-zed-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} {editing ? "Save changes" : "Add gift wrap"}
          </button>
          {editing && (
            <button type="button" onClick={() => { setEditing(null); setForm(empty); }} className="rounded-zed border border-edge px-5 py-3 text-sm font-semibold text-[#07111F]">
              Cancel
            </button>
          )}
        </div>
      </form>

      <ul className="space-y-3">
        {wraps.map((w) => (
          <li key={w.id} className="flex flex-wrap items-center justify-between gap-3 rounded-zed border border-edge bg-white p-4">
            <div className="min-w-0">
              <p className="font-semibold text-[#07111F]">
                {w.name}
                <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${w.active ? "bg-emerald-50 text-emerald-700" : "bg-panel text-[#334155]"}`}>
                  {w.active ? "Active" : "Hidden"}
                </span>
              </p>
              <p className="text-sm text-[#334155]">
                {formatKES(w.price)}{w.sku ? ` · ${w.sku}` : ""}{w.description ? ` · ${w.description}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => toggleActive(w)} className="rounded-zed border border-edge px-3 py-1.5 text-xs font-semibold text-[#07111F] hover:border-soft-sage">
                {w.active ? "Hide" : "Show"}
              </button>
              <button type="button" onClick={() => setEditing(w)} className="rounded-zed border border-edge px-3 py-1.5 text-xs font-semibold text-[#07111F] hover:border-soft-sage">
                Edit
              </button>
              <button type="button" onClick={() => void remove(w.id)} className="rounded-zed border border-red-100 p-1.5 text-red-500 hover:bg-red-50" aria-label={`Delete ${w.name}`}>
                <Trash2 className="size-4" />
              </button>
            </div>
          </li>
        ))}
        {wraps.length === 0 && <li className="rounded-zed border border-dashed border-edge bg-white p-6 text-center text-sm text-[#334155]">No gift wrap options yet.</li>}
      </ul>
    </div>
  );
}
