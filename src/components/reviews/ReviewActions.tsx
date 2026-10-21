"use client";

import { useState } from "react";
import { Flag, ThumbsUp } from "lucide-react";

const REPORT_REASONS = ["Spam or advert", "Offensive content", "Inaccurate information"] as const;

/**
 * "Helpful" voting and "report review" controls shared by the product page and
 * the storefront reviews page. Helpful votes require sign-in; reports do not.
 */
export function ReviewActions({
  reviewId,
  initialHelpful,
  signedIn,
}: {
  reviewId: string;
  initialHelpful: number;
  signedIn: boolean;
}) {
  const [helpful, setHelpful] = useState(initialHelpful);
  const [voted, setVoted] = useState(false);
  const [tip, setTip] = useState<string | null>(null);
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);
  const [busy, setBusy] = useState(false);

  async function vote() {
    if (busy) return;
    if (!signedIn) {
      setTip("Please sign in to mark reviews as helpful.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/helpful`, { method: "POST" });
      const data = (await res.json()) as { voted?: boolean; helpfulCount?: number };
      if (res.ok && typeof data.helpfulCount === "number") {
        setHelpful(data.helpfulCount);
        setVoted(Boolean(data.voted));
      } else if (res.status === 401) {
        setTip("Please sign in to mark reviews as helpful.");
      }
    } catch {
      setTip("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function report(reason: string) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        setReporting(false);
        setReported(true);
      } else {
        setTip(res.status === 429 ? "You have reported a lot recently. Please try again later." : "Something went wrong. Try again.");
      }
    } catch {
      setTip("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 space-y-2">
      {tip && <p className="text-xs font-medium text-rose-600">{tip}</p>}
      {reported ? (
        <p className="text-xs font-medium text-emerald-700">Thank you. Our team will take a look.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={vote}
            disabled={busy}
            aria-pressed={voted}
            aria-label="Mark this review as helpful"
            className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors ${
              voted
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-edge bg-white text-charcoal/70 hover:border-charcoal/30 hover:text-charcoal"
            } disabled:opacity-60`}
          >
            <ThumbsUp className={`size-3.5 ${voted ? "fill-current" : ""}`} />
            Helpful{helpful > 0 ? ` (${helpful})` : ""}
          </button>
          {!reporting ? (
            <button
              type="button"
              onClick={() => setReporting(true)}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium text-charcoal/45 transition-colors hover:text-rose-600"
            >
              <Flag className="size-3.5" />
              Report
            </button>
          ) : null}
        </div>
      )}
      {reporting && !reported && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-edge bg-white/70 p-2">
          <span className="text-[12px] font-semibold text-charcoal/60">Why report this review?</span>
          {REPORT_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              disabled={busy}
              onClick={() => report(reason)}
              className="min-h-7 rounded-full border border-edge bg-white px-2.5 py-0.5 text-[12px] font-medium text-charcoal/70 transition-colors hover:border-rose-300 hover:text-rose-600 disabled:opacity-60"
            >
              {reason}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setReporting(false)}
            className="min-h-7 px-1.5 text-[12px] font-medium text-charcoal/40 hover:text-charcoal"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
