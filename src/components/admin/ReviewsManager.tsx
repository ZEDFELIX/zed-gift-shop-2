"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Flag, Search, Star, Trash2, X } from "lucide-react";

export type AdminReviewRow = {
  id: string;
  productName: string;
  productSlug: string;
  author: string;
  rating: number;
  title: string | null;
  comment: string | null;
  images: string[];
  status: "PENDING" | "APPROVED" | "REJECTED";
  verifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
};

export type AdminReportRow = {
  id: string;
  reason: string;
  createdAt: string;
  reportedBy: string;
  reviewId: string;
  reviewRating: number;
  reviewTitle: string | null;
  reviewAuthor: string;
  reviewProduct: string;
  reviewProductSlug: string;
};

type Tab = "REPORTED" | "PENDING" | "APPROVED" | "REJECTED" | "ALL";

export function ReviewsManager({ reviews, reports }: { reviews: AdminReviewRow[]; reports: AdminReportRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<Tab>(reports.length > 0 ? "REPORTED" : "PENDING");
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reviews.filter((r) => {
      if (filter !== "ALL" && r.status !== filter) return false;
      if (!q) return true;
      return (
        r.title?.toLowerCase().includes(q) ||
        r.comment?.toLowerCase().includes(q) ||
        r.author.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q)
      );
    });
  }, [reviews, filter, query]);

  async function setStatus(id: string, status: "APPROVED" | "REJECTED") {
    setBusy(id);
    await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    router.refresh();
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this review permanently? This cannot be undone.")) return;
    setBusy(id);
    await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    setBusy(null);
    router.refresh();
  }

  async function resolveReport(id: string) {
    setBusy(id);
    await fetch(`/api/admin/review-reports/${id}`, { method: "PATCH" });
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {(["REPORTED", "PENDING", "APPROVED", "REJECTED", "ALL"] as Tab[])
          .filter((f) => f !== "REPORTED" || reports.length > 0)
          .map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className={`rounded-zed px-4 py-2 text-sm font-semibold ${filter === f ? "bg-zed-950 text-white" : "border border-edge bg-white text-[#07111F] hover:border-soft-sage"}`}>
              {f}
              {f === "REPORTED" && reports.length > 0 ? ` (${reports.length})` : ""}
            </button>
          ))}
        <label className="ml-auto relative block">
          <span className="sr-only">Search reviews</span>
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[#334155]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, text, author or product"
            className="min-h-9 w-64 rounded-zed border border-edge bg-white py-2 pl-8 pr-3 text-sm text-[#07111F] placeholder:text-[#94A3B8]"
          />
        </label>
      </div>

      {filter === "REPORTED" && reports.length > 0 && (
        <div className="space-y-2 rounded-zed border border-red-200 bg-red-50/60 p-4">
          <p className="text-sm font-bold text-[#B91C1C]">Shoppers flagged these reviews</p>
          {reports.map((rep) => (
            <div key={rep.id} className="rounded-lg border border-red-200 bg-white p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Flag className="size-4 text-red-500" />
                <span className="font-semibold text-[#07111F]">{rep.reason}</span>
                <span className="text-[#334155]">- reported by {rep.reportedBy}</span>
                <span className="text-xs text-[#334155]">{new Date(rep.createdAt).toLocaleDateString("en-KE")}</span>
              </div>
              <p className="mt-1 text-[13px] text-[#334155]">
                Review: {rep.reviewRating}★ by {rep.reviewAuthor}
                {rep.reviewTitle ? ` - "${rep.reviewTitle}"` : ""} on{" "}
                <Link target="_blank" href={`/product/${rep.reviewProductSlug}`} className="text-soft-sage underline underline-offset-2">
                  {rep.reviewProduct}
                </Link>
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" disabled={busy === rep.id} onClick={() => resolveReport(rep.id)}
                  className="rounded-zed bg-[#07111F] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">
                  Mark resolved
                </button>
                <button type="button" disabled={busy === rep.reviewId} onClick={() => setStatus(rep.reviewId, "REJECTED")}
                  className="rounded-zed border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 disabled:opacity-40">
                  Reject review
                </button>
                <button type="button" disabled={busy === rep.reviewId} onClick={() => remove(rep.reviewId)}
                  className="rounded-zed border border-edge bg-white px-3 py-2 text-xs font-bold text-[#B91C1C] disabled:opacity-40">
                  Delete review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {list.length === 0 && <p className="py-8 text-center text-sm text-[#334155]">Nothing here.</p>}

      {list.map((r) => (
        <div key={r.id} className={`rounded-zed border bg-white p-5 ${r.status === "PENDING" ? "border-amber-300" : "border-edge"}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-[#07111F]">{r.rating}</span>
              <span className="flex text-amber-500">
                {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="size-4 fill-current" />)}
              </span>
              <span className="text-[#334155]">- {r.author}</span>
              {r.verifiedPurchase && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">VERIFIED</span>}
              {r.helpfulCount > 0 && <span className="text-xs text-[#334155]">{r.helpfulCount} helpful</span>}
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${r.status === "APPROVED" ? "bg-emerald-50 text-emerald-700" : r.status === "REJECTED" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>
              {r.status}
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-[#07111F]">{r.title ?? <span className="font-normal italic text-[#334155]">No title</span>}</p>
          <p className="mt-1 text-sm text-[#07111F]">{r.comment ?? <span className="italic text-[#334155]">No comment</span>}</p>
          {r.images.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {r.images.map((src, i) => (
                <a key={src} href={src} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Review photo ${i + 1}`} className="size-14 rounded-lg object-cover ring-1 ring-black/10" />
                </a>
              ))}
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#334155]">
            <Link target="_blank" href={`/product/${r.productSlug}`} className="text-soft-sage underline underline-offset-2">{r.productName}</Link>
            <span>|</span>
            <span>{new Date(r.createdAt).toLocaleDateString("en-KE")}</span>
            <span className="ml-auto flex flex-wrap gap-2">
              {r.status !== "APPROVED" && (
                <button type="button" disabled={busy === r.id} onClick={() => setStatus(r.id, "APPROVED")} className="flex items-center gap-1 rounded-zed bg-emerald-600 px-4 py-2 font-bold text-white disabled:opacity-40">
                  <Check className="size-4" /> Approve
                </button>
              )}
              {r.status !== "REJECTED" && (
                <button type="button" disabled={busy === r.id} onClick={() => setStatus(r.id, "REJECTED")} className="flex items-center gap-1 rounded-zed border border-red-200 px-4 py-2 font-bold text-red-600 disabled:opacity-40">
                  <X className="size-4" /> Reject
                </button>
              )}
              <button type="button" disabled={busy === r.id} onClick={() => remove(r.id)} className="flex items-center gap-1 rounded-zed border border-edge px-4 py-2 font-bold text-[#B91C1C] disabled:opacity-40">
                <Trash2 className="size-4" /> Delete
              </button>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
