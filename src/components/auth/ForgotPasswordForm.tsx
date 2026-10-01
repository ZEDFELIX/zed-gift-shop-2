"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Mail } from "lucide-react";

export function ForgotPasswordForm() {
 const [email, setEmail] = useState("");
 const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");
 const [error, setError] = useState<string | null>(null);

 async function submit(e: React.FormEvent) {
 e.preventDefault();
 setStatus("loading");
 setError(null);
 try {
 const res = await fetch("/api/auth/forgot-password", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ email }),
 });
 const data = (await res.json()) as { error?: string };
 if (!res.ok) {
 setError(data.error ?? "Something went wrong.");
 setStatus("idle");
 return;
 }
 setStatus("sent");
 } catch {
 setError("Network error - please try again.");
 setStatus("idle");
 }
 }

 if (status === "sent") {
 return (
 <div className="glass-card w-full max-w-md rounded-zed p-6 text-center lg:p-8">
 <span className="mx-auto grid size-14 place-items-center rounded-full bg-zed-950 text-white">
 <CheckCircle2 className="size-7" />
 </span>
 <h1 className="mt-4 font-display text-2xl font-bold text-[#07111F]">Check your inbox</h1>
 <p className="mt-2 text-sm text-[#334155]">
 If an account exists for <strong>{email}</strong>, we&apos;ve emailed you a link to reset your password. It expires in 1 hour.
 </p>
 <Link href="/login" className="mt-6 inline-block font-semibold text-soft-sage underline underline-offset-2">Back to log in</Link>
 </div>
 );
 }

 return (
 <form onSubmit={submit} className="glass-card w-full max-w-md space-y-4 rounded-zed p-6 lg:p-8">
 <div className="text-center">
 <p className="eyebrow">Need a hand?</p>
 <h1 className="mt-2 font-display text-2xl font-bold text-[#07111F]">Reset your password</h1>
 <p className="mt-1.5 text-sm text-[#334155]">Enter your account email and we&apos;ll send you a reset link.</p>
 </div>
 <div>
 <label className="label" htmlFor="fp-email">Email</label>
 <div className="relative">
 <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#334155]" />
 <input id="fp-email" type="email" className="field pl-9" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
 </div>
 </div>
 {error && <p className="rounded-zed bg-red-50/70 px-4 py-3 text-sm text-red-700 backdrop-blur-sm">{error}</p>}
 <button type="submit" disabled={status === "loading"} className="flex w-full items-center justify-center gap-2 rounded-zed bg-zed-950 py-3.5 text-sm font-bold uppercase tracking-wider text-white disabled:opacity-50">
 {status === "loading" ? <Loader2 className="size-4 animate-spin" /> : "Send reset link"}
 </button>
 <p className="text-center text-sm">
 <Link href="/login" className="font-semibold text-soft-sage underline underline-offset-2">Back to log in</Link>
 </p>
 </form>
 );
}