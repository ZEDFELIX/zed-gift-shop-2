"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { ORDER_STATUS_STEPS } from "@/lib/constants";

export function OrderStatusController({ orderId, orderStatus, paymentStatus, receipt }: {
 orderId: string;
 orderStatus: string;
 paymentStatus: string;
 receipt: string | null;
}) {
 const router = useRouter();
 const [os, setOs] = useState(orderStatus);
 const [ps, setPs] = useState(paymentStatus);
 const [rec, setRec] = useState(receipt ?? "");
 const [busy, setBusy] = useState(false);
 const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
 const [error, setError] = useState<string | null>(null);

 async function save(e: React.FormEvent) {
 e.preventDefault();
 setBusy(true);
 setStatus("idle");
 setError(null);
 const res = await fetch(`/api/admin/orders/${orderId}`, {
 method: "PATCH",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ orderStatus: os, paymentStatus: ps, mpesaReceipt: rec || undefined }),
 });
 const data = (await res.json()) as { error?: string; order?: { orderStatus: string } };
 if (!res.ok) {
 setError(data.error ?? "Couldn't update the order.");
 setStatus("error");
 setBusy(false);
 return;
 }
 setStatus("saved");
 setBusy(false);
 router.refresh();
 }

 return (
 <form onSubmit={save} className="space-y-4 rounded-zed border border-edge bg-white p-5">
 <h2 className="font-display text-base font-bold text-[#171717]">Update order</h2>
 <div className="grid gap-4 sm:grid-cols-3">
 <div>
 <label className="label" htmlFor="os-status">Order status</label>
 <select id="os-status" className="field" value={os} onChange={(e) => setOs(e.target.value)} disabled={ps !== "SUCCESSFUL"}>
 {ORDER_STATUS_STEPS.map((s) => <option key={s.status} value={s.status}>{s.label}</option>)}
 </select>
 </div>
 <div>
 <label className="label" htmlFor="os-pay">Payment</label>
 <select id="os-pay" className="field" value={ps} onChange={(e) => setPs(e.target.value)}>
 {["PENDING", "SUCCESSFUL", "FAILED", "CANCELLED", "TIMEOUT"].map((v) => <option key={v} value={v}>{v}</option>)}
 </select>
 </div>
 <div>
 <label className="label" htmlFor="os-receipt">M-PESA receipt</label>
 <input id="os-receipt" className="field" value={rec} onChange={(e) => setRec(e.target.value)} placeholder="e.g. SFT43XXXX" />
 </div>
 </div>
 {error && <p className="rounded-zed bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}
 {status === "saved" && <p className="rounded-zed bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">Saved. The customer gets an email on new status.</p>}
 <button type="submit" disabled={busy} className="flex items-center gap-2 rounded-zed bg-zed-950 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">
 {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save
 </button>
 </form>
 );
}