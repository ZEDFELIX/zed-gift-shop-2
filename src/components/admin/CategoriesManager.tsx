"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import type { SerializedCategory } from "@/app/admin/categories/page";

const KINDS = ["CATEGORY", "OCCASION", "RECIPIENT"] as const;

type Draft = {
  name: string;
  slug: string;
  kind: (typeof KINDS)[number];
  description: string;
  image: string;
  sortOrder: number;
};

const EMPTY: Draft = { name: "", slug: "", kind: "CATEGORY", description: "", image: "", sortOrder: 0 };

export function CategoriesManager({ kind, initial }: { kind: string; initial: SerializedCategory[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function refresh() {
    const res = await fetch("/api/admin/categories", { cache: "no-store" });
    if (res.ok) {
      const body = await res.json();
      setRows(body.data);
    }
    startTransition(() => router.refresh());
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, description: draft.description || undefined, image: draft.image || undefined }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not create the category.");
      return;
    }
    setDraft(EMPTY);
    await refresh();
  }

  async function toggleActive(row: SerializedCategory) {
    await fetch(`/api/admin/categories/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !row.active }),
    });
    await refresh();
  }

  async function remove(row: SerializedCategory) {
    if (!confirm(`Delete "${row.name}"? If it is in use it will be archived instead.`)) return;
    const res = await fetch(`/api/admin/categories/${row.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not delete the category.");
      return;
    }
    await refresh();
  }

  return (
    <div className="space-y-5">
      <form onSubmit={create} className="rounded-zed border border-edge bg-white p-5">
        <h2 className="flex items-center gap-2 font-display text-base font-bold text-[#07111F]">
          <Plus className="size-4" /> New category
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input className="field" placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required />
          <input
            className="field"
            placeholder="slug-like-this"
            value={draft.slug}
            onChange={(e) => setDraft({ ...draft, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
            required
          />
          <select className="field" value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as Draft["kind"] })}>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <input className="field" placeholder="Image URL (optional)" value={draft.image} onChange={(e) => setDraft({ ...draft, image: e.target.value })} />
          <input
            className="field"
            type="number"
            min={0}
            placeholder="Sort order"
            value={draft.sortOrder}
            onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) || 0 })}
          />
          <input className="field" placeholder="Description (optional)" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        </div>
        {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
        <button type="submit" disabled={pending} className="mt-4 rounded-zed bg-zed-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zed-900 disabled:opacity-60">
          Create category
        </button>
      </form>

      <div className="overflow-x-auto rounded-zed border border-edge bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-edge bg-panel text-left text-xs uppercase tracking-wider text-[#334155]">
              <th className="p-3">Name</th>
              <th className="p-3">Kind</th>
              <th className="p-3">Products</th>
              <th className="p-3">Sort</th>
              <th className="p-3">Active</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-panel/50">
                <td className="p-3">
                  <p className="font-semibold text-[#07111F]">{row.name}</p>
                  <p className="text-xs text-[#334155]">/{row.slug}</p>
                </td>
                <td className="p-3 text-[#334155]">{row.kind}</td>
                <td className="p-3 text-[#334155]">{row.productCount}</td>
                <td className="p-3 text-[#334155]">{row.sortOrder}</td>
                <td className="p-3">
                  <button
                    onClick={() => toggleActive(row)}
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${row.active ? "bg-emerald-50 text-emerald-700" : "bg-panel text-[#334155]"}`}
                  >
                    {row.active ? "Active" : "Hidden"}
                  </button>
                </td>
                <td className="p-3">
                  <button onClick={() => remove(row)} className="text-red-600 hover:text-red-700" aria-label="Delete category">
                    <Trash2 className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[#334155]">
                  No categories for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
