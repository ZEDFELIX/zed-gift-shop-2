"use client";

import { useState } from "react";
import { BellRing, Check } from "lucide-react";

export function NotifyWhenBack({ productId, variantId }: { productId: string; variantId?: string | null }) {
 const [email, setEmail] = useState("");
 const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
 const [error, setError] = useState("");

 async function submit(e: React.FormEvent) {
 e.preventDefault();
 setState("busy");
 setError("");
 try {
 const res = await fetch("/api/stock-alerts", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ productId, variantId: variantId ?? null, email }),
 });
 const data = (await res.json()) as { ok?: boolean; error?: string };
 if (!res.ok || !data.ok) {
 setState("error");
 setError(data.error ?? "Could not save your request.");
 return;
 }
 setState("done");
 } catch {
 setState("error");
 setError("Could not save your request.");
 }
 }

 if (state === "done") {
 return (
 <div className="flex items-center gap-2 rounded-zed glass-panel px-4 py-3 text-sm font-semibold text-[#07111F]">
 <Check className="size-4 text-soft-sage" /> We&apos;ll email you the moment it&apos;s back.
 </div>
 );
 }

 return (
 <form onSubmit={submit} className="glass-card rounded-zed p-4">
 <p className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
 <BellRing className="size-4 text-soft-sage" /> This gift is out of stock
 </p>
 <p className="mt-1 text-sm text-[rgba(48,37,34,0.62)]">Leave your email and we&apos;ll tell you when it returns.</p>
 <div className="mt-3 flex flex-col gap-2 sm:flex-row">
 <label className="sr-only" htmlFor={`notify-${productId}`}>Email address</label>
 <input
 id={`notify-${productId}`}
 type="email"
 required
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 placeholder="you@example.com"
 className="field flex-1"
 autoComplete="email"
 />
 <button type="submit" disabled={state === "busy"} className="rounded-zed bg-zed-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-60">
 {state === "busy" ? "Saving..." : "Notify me"}
 </button>
 </div>
 {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
 </form>
 );
}
