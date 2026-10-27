"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteProductButton({ productId, productName }: { productId: string; productName: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function deleteProduct() {
    if (deleting) return;
    const confirmed = window.confirm(
      `Delete "${productName}" permanently? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/products/${encodeURIComponent(productId)}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof result.error === "string" ? result.error : "Could not delete this product. Please try again.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. The product was not deleted. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={deleteProduct}
        disabled={deleting}
        aria-label={`Delete ${productName}`}
        className="inline-flex items-center gap-1.5 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Trash2 className="size-3.5" />
        {deleting ? "Deleting..." : "Delete"}
      </button>
      {error && <p role="alert" className="max-w-56 text-left text-xs text-red-700">{error}</p>}
    </div>
  );
}
