"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export type WholesaleQuoteRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  organisation: string;
  location: string;
  budget: number | null;
  details: string;
  items: { name: string; quantity: number }[];
  status: string;
  createdAt: string;
};

const STATUS_OPTIONS = ["NEW", "IN_PROGRESS", "QUOTED", "WON", "CLOSED"] as const;

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  NEW: { label: "New", cls: "bg-rose-50 text-rose-700" },
  IN_PROGRESS: { label: "In progress", cls: "bg-amber-50 text-amber-700" },
  QUOTED: { label: "Quoted", cls: "bg-sky-50 text-sky-700" },
  WON: { label: "Won", cls: "bg-emerald-50 text-emerald-700" },
  CLOSED: { label: "Closed", cls: "bg-charcoal/10 text-charcoal/60" },
};

export function WholesaleQuotesManager({ quotes }: { quotes: WholesaleQuoteRow[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(id: string, status: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/wholesale/quotes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Couldn't update the quote.");
        return;
      }
      // Update the row in place via a reload so server data stays authoritative.
      window.location.reload();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  if (!quotes.length) {
    return <p className="rounded-zed border border-edge bg-white p-6 text-sm text-[#334155]">No wholesale quotation requests yet.</p>;
  }

  return (
    <div className="space-y-3">
      {error && <p className="rounded-zed bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {quotes.map((quote) => {
        const badge = STATUS_LABEL[quote.status];
        return (
          <div key={quote.id} className="rounded-zed border border-edge bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#07111F]">
                  {quote.name}
                  {quote.organisation ? <span className="text-charcoal/50"> · {quote.organisation}</span> : null}
                </p>
                <p className="text-xs text-[#334155]">
                  <a href={`tel:${quote.phone.replace(/\s+/g, "")}`} className="font-semibold text-rose-600">{quote.phone}</a>
                  {quote.email ? ` · ${quote.email}` : ""}
                  {` · ${quote.location}`}
                  {quote.budget != null && quote.budget > 0 ? ` · Budget ~KSh ${quote.budget.toLocaleString("en-KE")}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {badge && <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${badge.cls}`}>{badge.label}</span>}
                {busyId === quote.id ? (
                  <Loader2 className="size-4 animate-spin text-charcoal/40" />
                ) : (
                  <select
                    aria-label={`Update status for ${quote.name}`}
                    value={quote.status}
                    onChange={(e) => updateStatus(quote.id, e.target.value)}
                    className="rounded-md border border-edge bg-white px-2 py-1.5 text-xs font-semibold"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{STATUS_LABEL[s].label}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <ul className="mt-3 space-y-1 rounded-lg bg-panel/40 p-3 text-sm">
              {quote.items.map((item, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span className="min-w-0 truncate text-[#07111F]">{item.name}</span>
                  <span className="shrink-0 font-bold text-charcoal-950">x{item.quantity}</span>
                </li>
              ))}
            </ul>

            {quote.details && <p className="mt-2 text-sm text-[#334155]"><span className="font-semibold">Requirements:</span> {quote.details}</p>}
            <p className="mt-1 text-[11px] text-charcoal/40">Received {new Date(quote.createdAt).toLocaleString()}</p>
          </div>
        );
      })}
    </div>
  );
}
