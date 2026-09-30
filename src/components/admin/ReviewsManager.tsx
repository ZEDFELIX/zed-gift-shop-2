"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Star, X } from "lucide-react";

type ReviewRow = {
 id: string;
 productName: string;
 productSlug: string;
 author: string;
 rating: number;
 title: string | null;
 comment: string | null;
 status: "PENDING" | "APPROVED" | "REJECTED";
 verifiedPurchase: boolean;
 createdAt: string;
};

export function ReviewsManager({ reviews }: { reviews: ReviewRow[] }) {
 const router = useRouter();
 const [busy, setBusy] = useState<string | null>(null);
 const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");

 const list = filter === "ALL" ? reviews : reviews.filter((r) => r.status === filter);

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

 return (
 <div className="space-y-3">
 <div className="flex gap-2">
 {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((f) => (
 <button key={f} type="button" onClick={() => setFilter(f)}
 className={`rounded-zed px-4 py-2 text-sm font-semibold ${filter === f ? "bg-zed-950 text-white" : "border border-edge bg-white text-[#171717] hover:border-soft-sage"}`}>
 {f}
 </button>
 ))}
 </div>

 {list.length === 0 && <p className="py-8 text-center text-sm text-[#6B6B6B]">Nothing here.</p>}

 {list.map((r) => (
 <div key={r.id} className={`rounded-zed border bg-white p-5 ${r.status === "PENDING" ? "border-amber-300" : "border-edge"}`}>
 <div className="flex flex-wrap items-center justify-between gap-2">
 <div className="flex items-center gap-2 text-sm">
 <span className="font-semibold text-[#171717]">{r.rating}</span>
 <span className="flex text-amber-500">
 {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="size-4 fill-current" />)}
 </span>
 <span className="text-[#6B6B6B]">- {r.author}</span>
 {r.verifiedPurchase && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">VERIFIED</span>}
 </div>
 <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${r.status === "APPROVED" ? "bg-emerald-50 text-emerald-700" : r.status === "REJECTED" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>
 {r.status}
 </span>
 </div>
 <p className="mt-2 text-sm font-semibold text-[#171717]">{r.title ?? <span className="font-normal italic text-[#6B6B6B]">No title</span>}</p>
 <p className="mt-1 text-sm text-[#171717]">{r.comment ?? <span className="italic text-[#6B6B6B]">No comment</span>}</p>
 <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#6B6B6B]">
 <Link target="_blank" href={`/product/${r.productSlug}`} className="text-soft-sage underline underline-offset-2">{r.productName}</Link>
 <span>|</span>
 <span>{new Date(r.createdAt).toLocaleDateString("en-KE")}</span>
 {r.status === "PENDING" && (
 <span className="ml-auto flex gap-2">
 <button type="button" disabled={busy === r.id} onClick={() => setStatus(r.id, "APPROVED")} className="flex items-center gap-1 rounded-zed bg-emerald-600 px-3 py-1.5 font-bold text-white disabled:opacity-40">
 <Check className="size-3.5" /> Approve
 </button>
 <button type="button" disabled={busy === r.id} onClick={() => setStatus(r.id, "REJECTED")} className="flex items-center gap-1 rounded-zed border border-red-200 px-3 py-1.5 font-bold text-red-600 disabled:opacity-40">
 <X className="size-3.5" /> Reject
 </button>
 </span>
 )}
 </div>
 </div>
 ))}
 </div>
 );
}