"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArchiveRestore, Archive } from "lucide-react";

export function ProductArchiveButton({ productId, productName, status }: {
  productId: string;
  productName: string;
  status: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const archived = status === "ARCHIVED";

  async function changeStatus() {
    if (saving) return;
    const action = archived ? "activate" : "archive";
    const message = archived
      ? `Restore "${productName}" to the active catalogue?`
      : `Archive "${productName}"? It will be hidden from the shop but kept in your admin records.`;
    if (!window.confirm(message)) return;

    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/products/${encodeURIComponent(productId)}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof result.error === "string" ? result.error : "Could not update this product.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={changeStatus}
        disabled={saving}
        aria-label={archived ? `Restore ${productName}` : `Archive ${productName}`}
        className="inline-flex items-center gap-1.5 rounded-md border border-edge px-2.5 py-1.5 text-xs font-semibold text-[#334155] transition-colors hover:bg-panel disabled:cursor-not-allowed disabled:opacity-50"
      >
        {archived ? <ArchiveRestore className="size-3.5" /> : <Archive className="size-3.5" />}
        {saving ? "Saving..." : archived ? "Restore" : "Archive"}
      </button>
      {error && <p role="alert" className="max-w-56 text-left text-xs text-red-700">{error}</p>}
    </div>
  );
}
