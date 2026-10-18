"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

type ReturnItem = {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  order: { orderNumber: string; email: string; name: string; phone: string };
  user: { name: string; email: string } | null;
};

const STATUSES = ["REQUESTED", "APPROVED", "REJECTED", "COMPLETED"] as const;

const STATUS_STYLES: Record<string, string> = {
  REQUESTED: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
  COMPLETED: "bg-panel text-[#334155]",
};

export function ReturnsManager() {
  const [items, setItems] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/returns", { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as { items?: ReturnItem[] };
      setItems(data.items ?? []);
      setError("");
    } catch {
      setError("Could not load return requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: string) {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch("/api/admin/returns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Could not update the request.");
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[#334155]">{items.length} return / exchange request{items.length === 1 ? "" : "s"}</p>
        <button
          type="button"
          onClick={load}
          className="flex items-center gap-1.5 rounded-zed border border-edge bg-white px-3 py-2 text-sm font-semibold text-[#07111F] hover:border-soft-sage"
        >
          <RefreshCw className="size-4" /> Refresh
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-[#334155]">Loading…</p>
      ) : items.length === 0 ? (
        <p className="rounded-zed border border-dashed border-edge p-8 text-center text-sm text-[#334155]">
          No return requests yet.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <div key={r.id} className="rounded-zed border border-edge bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#07111F]">
                    {r.order.orderNumber} <span className="font-normal text-[#334155]">· {r.user?.name ?? r.order.name}</span>
                  </p>
                  <p className="text-xs text-[#334155]">{r.user?.email ?? r.order.email} · {new Date(r.createdAt).toLocaleString("en-KE")}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_STYLES[r.status] ?? "bg-panel text-[#334155]"}`}>
                  {r.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-[#07111F]"><strong>Reason:</strong> {r.reason}</p>
              {r.details && <p className="mt-1 text-sm text-[#334155]">{r.details}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={busyId === r.id || r.status === s}
                    onClick={() => setStatus(r.id, s)}
                    className={`rounded-zed px-3 py-1.5 text-xs font-bold ${
                      r.status === s ? "bg-zed-950 text-white" : "bg-panel text-[#334155] hover:bg-panel/70"
                    } disabled:opacity-60`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
