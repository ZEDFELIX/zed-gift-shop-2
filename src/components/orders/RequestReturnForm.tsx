"use client";

import { useState } from "react";
import { Check, RotateCcw } from "lucide-react";

export function RequestReturnForm({ orderId }: { orderId: string }) {
 const [reason, setReason] = useState("");
 const [details, setDetails] = useState("");
 const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
 const [error, setError] = useState("");

 async function submit(e: React.FormEvent) {
 e.preventDefault();
 setState("busy");
 setError("");
 try {
 const res = await fetch("/api/account/returns", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ orderId, reason, details: details || undefined }),
 });
 const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
 if (!res.ok || !data.ok) {
 setState("error");
 setError(data.error ?? "Could not submit the request.");
 return;
 }
 setState("done");
 } catch {
 setState("error");
 setError("Could not submit the request.");
 }
 }

 if (state === "done") {
 return (
 <div className="flex items-center gap-2 rounded-zed glass-panel px-4 py-3 text-sm font-semibold text-[#07111F]">
 <Check className="size-4 text-soft-sage" /> Return request sent. We&apos;ll be in touch.
 </div>
 );
 }

 return (
 <form onSubmit={submit} className="glass-card rounded-zed p-5">
 <p className="flex items-center gap-2 font-display text-base font-bold text-[#07111F]">
 <RotateCcw className="size-4 text-soft-sage" /> Request a return or exchange
 </p>
 <p className="mt-1 text-sm text-[#334155]">Within 7 days of delivery, change your mind or received something damaged.</p>
 <div className="mt-3 space-y-3">
 <div>
 <label className="label" htmlFor={`return-reason-${orderId}`}>Reason</label>
 <input
 id={`return-reason-${orderId}`}
 value={reason}
 onChange={(e) => setReason(e.target.value)}
 maxLength={120}
 required
 className="field"
 placeholder="Arrived damaged, wrong item, changed my mind…"
 />
 </div>
 <div>
 <label className="label" htmlFor={`return-details-${orderId}`}>Details <span className="font-normal text-[rgba(48,37,34,0.62)]">(optional)</span></label>
 <textarea
 id={`return-details-${orderId}`}
 value={details}
 onChange={(e) => setDetails(e.target.value)}
 maxLength={1000}
 rows={3}
 className="field"
 placeholder="Anything we should know…"
 />
 </div>
 </div>
 {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
 <button type="submit" disabled={state === "busy"} className="mt-3 rounded-zed bg-zed-950 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
 {state === "busy" ? "Sending..." : "Send request"}
 </button>
 </form>
 );
}
