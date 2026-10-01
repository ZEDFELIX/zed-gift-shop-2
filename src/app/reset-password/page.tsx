"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, Lock } from "lucide-react";

function ResetForm() {
 const searchParams = useSearchParams();
 const router = useRouter();
 const token = searchParams.get("token") ?? "";
 const [password, setPassword] = useState("");
 const [confirm, setConfirm] = useState("");
 const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
 const [error, setError] = useState<string | null>(null);

 async function submit(e: React.FormEvent) {
 e.preventDefault();
 if (password !== confirm) {
 setError("Passwords don't match.");
 return;
 }
 setStatus("loading");
 setError(null);
 try {
 const res = await fetch("/api/auth/reset-password", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ token, password }),
 });
 const data = (await res.json()) as { error?: string };
 if (!res.ok) {
 setError(data.error ?? "Couldn't reset your password.");
 setStatus("idle");
 return;
 }
 setStatus("done");
 router.push("/login");
 } catch {
 setError("Network error - please try again.");
 setStatus("idle");
 }
 }

 if (status === "done") {
 return (
 <div className="glass-card w-full max-w-md rounded-zed p-6 text-center lg:p-8">
 <span className="mx-auto grid size-14 place-items-center rounded-full bg-zed-950 text-white">
 <CheckCircle2 className="size-7" />
 </span>
 <h1 className="mt-4 font-display text-2xl font-bold text-[#07111F]">Password updated</h1>
 <p className="mt-2 text-sm text-[#334155]">You can now log in with your new password.</p>
 <Link href="/login" className="mt-6 inline-block rounded-zed bg-zed-950 px-6 py-3 text-sm font-bold text-white">Log in</Link>
 </div>
 );
 }

 return (
 <form onSubmit={submit} className="glass-card w-full max-w-md space-y-4 rounded-zed p-6 lg:p-8">
 <div className="text-center">
 <p className="eyebrow">One last step</p>
 <h1 className="mt-2 font-display text-2xl font-bold text-[#07111F]">Choose a new password</h1>
 </div>
 {!token && <p className="rounded-zed bg-amber-50/70 px-4 py-3 text-sm text-amber-800 backdrop-blur-sm">Missing reset token. Open the link from your email again.</p>}
 {token && (
 <>
 <div>
 <label className="label" htmlFor="rp-password">New password</label>
 <div className="relative">
 <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#334155]" />
 <input id="rp-password" type="password" className="field pl-9" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
 </div>
 </div>
 <div>
 <label className="label" htmlFor="rp-confirm">Confirm password</label>
 <input id="rp-confirm" type="password" className="field" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} autoComplete="new-password" />
 </div>
 {error && <p className="rounded-zed bg-red-50/70 px-4 py-3 text-sm text-red-700 backdrop-blur-sm">{error}</p>}
 <button type="submit" disabled={status === "loading"} className="flex w-full items-center justify-center gap-2 rounded-zed bg-zed-950 py-3.5 text-sm font-bold uppercase tracking-wider text-white disabled:opacity-50">
 {status === "loading" ? <Loader2 className="size-4 animate-spin" /> : "Reset password"}
 </button>
 </>
 )}
 </form>
 );
}

export default function ResetPasswordPage() {
 return (
 <div className="container-zed flex min-h-[60vh] items-center justify-center py-14 lg:py-24">
 <Suspense fallback={<p className="text-sm text-[#334155]">Loading...</p>}>
 <ResetForm />
 </Suspense>
 </div>
 );
}