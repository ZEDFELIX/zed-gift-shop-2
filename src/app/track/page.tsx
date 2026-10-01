"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2, PackageSearch, Search, Truck } from "lucide-react";
import { formatKES } from "@/lib/utils";
import { ORDER_STATUS_STEPS } from "@/lib/constants";

type TrackedOrder = {
 orderNumber: string;
 orderStatus: string;
 paymentStatus: string;
 createdAt: string;
 total: number;
 county: string;
 town: string;
 deliveryMethod: string;
 isGift: boolean;
 email: string;
 items: { name: string; quantity: number; price: number; giftWrapPrice: number; image: string | null }[];
};

export default function TrackPage() {
 return (
 <Suspense fallback={<div className="container-zed max-w-2xl py-20 text-center text-sm text-[#6B6B6B]">Loading...</div>}>
 <TrackContent />
 </Suspense>
 );
}

function TrackContent() {
 const searchParams = useSearchParams();
 const initialOrder = searchParams.get("order") ?? "";
 const [orderNumber, setOrderNumber] = useState(initialOrder);
 const [orderKey, setOrderKey] = useState("");
 const [result, setResult] = useState<TrackedOrder | null>(null);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);

 async function lookup(e: React.FormEvent) {
 e.preventDefault();
 setLoading(true);
 setError(null);
 setResult(null);
 try {
 const res = await fetch("/api/orders/lookup", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ orderNumber, orderKey }),
 });
 const data = (await res.json()) as { error?: string } & TrackedOrder;
 if (!res.ok) {
 setError(data.error ?? "No order found.");
 } else {
 const { error: _e, ...rest } = data as TrackedOrder & { error?: string };
 void _e;
 setResult(rest);
 }
 } catch {
 setError("Couldn't reach the server. Please try again.");
 } finally {
 setLoading(false);
 }
 }

 const steps = ORDER_STATUS_STEPS.map((s) => s.status);
 const currentIndex = steps.indexOf(result?.orderStatus ?? "");
 const paid = result?.paymentStatus === "SUCCESSFUL";

 return (
 <div className="container-zed max-w-2xl py-14 lg:py-20">
 <header className="text-center">
 <p className="eyebrow">Where&apos;s my gift?</p>
 <h1 className="mt-2 font-display text-3xl font-bold text-[#171717] lg:text-4xl">Track your order</h1>
 <p className="mt-2 text-sm text-[#6B6B6B]">Enter the order number and the email or phone you used at checkout.</p>
 </header>

 <form onSubmit={lookup} className="glass-card mt-8 space-y-3 rounded-zed p-5">
 <div>
 <label className="label" htmlFor="t-number">Order number</label>
 <input id="t-number" className="field" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} required placeholder="ZED-XXXXXX" />
 </div>
 <div>
 <label className="label" htmlFor="t-key">Email or last digits of M-PESA phone</label>
 <input id="t-key" className="field" value={orderKey} onChange={(e) => setOrderKey(e.target.value)} required placeholder="you@example.com or 0712..." />
 </div>
 <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-zed bg-zed-950 py-3.5 text-sm font-bold uppercase tracking-wider text-white disabled:opacity-50">
 {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />} Track order
 </button>
 {error && <p className="rounded-zed bg-red-50/70 px-4 py-3 text-sm text-red-700 backdrop-blur-sm">{error}</p>}
 </form>

 {result && (
 <section className="mt-8 space-y-5">
 <div className="glass-card rounded-zed p-5">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div className="flex items-center gap-3">
 <span className="glass-strong grid size-11 place-items-center rounded-full text-deep-olive">
 <Truck className="size-5" />
 </span>
 <div>
 <p className="font-display text-lg font-bold text-[#171717]">{result.orderNumber}</p>
 <p className="text-xs text-[#6B6B6B]">
 Placed {new Date(result.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })} | {result.county}, {result.town}
 </p>
 </div>
 </div>
 <div className="text-right">
 <p className="text-xs text-[#6B6B6B]">Total</p>
 <p className="font-bold text-[#171717]">{formatKES(result.total)}</p>
 <p className={`text-xs font-semibold ${paid ? "text-emerald-600" : "text-amber-600"}`}>{paid ? "Paid via M-PESA" : "Awaiting payment"}</p>
 </div>
 </div>

 {!paid && (
 <div className="mt-4 rounded-zed bg-amber-50/70 px-4 py-3 text-sm text-amber-900 backdrop-blur-sm">
 This order isn&apos;t paid yet. Complete the M-PESA prompt on your phone or contact <span className="font-semibold">+254 711 436169</span> to help complete it.
 </div>
 )}

 <ol className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
 {steps.map((s, i) => (
 <li key={s} className={`relative rounded-zed border p-3 ${i <= currentIndex ? "border-soft-sage bg-warm-white" : "border-white/50 bg-white/30 text-[#6B6B6B]"}`}>
 <span className="text-[10px] font-bold uppercase tracking-widest">{ORDER_STATUS_STEPS[i].label}</span>
 {i <= currentIndex && <span className="mt-1 block size-1.5 rounded-full bg-soft-sage" />}
 </li>
 ))}
 </ol>
 </div>

 <div className="glass-panel rounded-zed p-5">
 <h2 className="font-display text-base font-bold text-[#171717]">Your items</h2>
 <ul className="mt-3 divide-y divide-white/40">
 {result.items.map((item, idx) => (
 <li key={idx} className="flex items-center gap-3 py-3">
 <span className="relative block size-12 shrink-0 overflow-hidden rounded-zed glass-panel">
 {item.image && <Image src={item.image} alt="" fill unoptimized className="object-cover" />}
 </span>
 <div className="min-w-0 flex-1">
 <p className="truncate text-sm font-medium text-[#171717]">{item.name}</p>
 <p className="text-xs text-[#6B6B6B]">Qty {item.quantity}{item.giftWrapPrice > 0 ? " | Gift wrap" : ""}</p>
 </div>
 <p className="text-sm font-semibold text-[#171717]">{formatKES((item.price + item.giftWrapPrice) * item.quantity)}</p>
 </li>
 ))}
 </ul>
 </div>

 <p className="text-center text-xs text-[#6B6B6B]">
 Need help? WhatsApp <a className="font-semibold text-soft-sage underline" href="tel:+254711436169">+254 711 436169</a> with your order number.
 </p>
 </section>
 )}

 {!result && !error && (
 <div className="mt-10 flex flex-col items-center text-center text-sm text-[#6B6B6B]">
 <PackageSearch className="mb-2 size-10 text-soft-sage/50" />
 <p>New to ZED? <Link href="/shop" className="text-soft-sage underline underline-offset-2">Explore the gift shop</Link></p>
 </div>
 )}
 </div>
 );
}