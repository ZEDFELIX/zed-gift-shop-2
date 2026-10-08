"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Lock, LogIn, Mail, User } from "lucide-react";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
 const router = useRouter();
 const searchParams = useSearchParams();
 const next = searchParams.get("next") ?? "/account";
 const isLogin = mode === "login";

 const [form, setForm] = useState({ name: "", email: "", password: "" });
 const [error, setError] = useState<string | null>(null);
 const [loading, setLoading] = useState(false);

 async function submit(e: React.FormEvent) {
 e.preventDefault();
 setLoading(true);
 setError(null);
 try {
 const res = await fetch(isLogin ? "/api/auth/login" : "/api/auth/register", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(form),
 });
 const data = (await res.json()) as { error?: string; user?: { id: string } };
 if (!res.ok || !data.user) {
 setError(data.error ?? "Something went wrong. Please try again.");
 setLoading(false);
 return;
 }
 const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/account";
 router.push(safeNext);
 router.refresh();
 } catch {
 setError("Network error - please try again.");
 setLoading(false);
 }
 }

 return (
 <div className="w-full max-w-md">
 <form onSubmit={submit} className="glass-card space-y-4 rounded-zed p-6 lg:p-8">
 <div className="text-center">
 <p className="eyebrow">{isLogin ? "Welcome back" : "Join the club"}</p>
 <h1 className="mt-2 font-display text-2xl font-bold text-[#07111F]">
 {isLogin ? "Log in to your account" : "Create a free account"}
 </h1>
 <p className="mt-1.5 text-sm text-[#334155]">
 {isLogin ? "Track orders, save favourites & checkout faster." : "Save addresses, get occasion reminders & faster checkout."}
 </p>
 </div>

 {!isLogin && (
 <div>
 <label className="label" htmlFor="a-name">Full name</label>
 <div className="relative">
 <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#334155]" />
 <input id="a-name" className="field auth-field pl-9 relative z-10 pointer-events-auto select-text" placeholder="Jane Mwangi" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
 </div>
 </div>
 )}

 <div>
 <label className="label" htmlFor="a-email">Email</label>
 <div className="relative">
 <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#334155]" />
 <input id="a-email" type="email" autoComplete="email" className="field auth-field pl-9 relative z-10 pointer-events-auto select-text" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
 </div>
 </div>

 <div>
 <label className="label" htmlFor="a-password">Password</label>
 <div className="relative">
 <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#334155]" />
 <input id="a-password" type="password" autoComplete={isLogin ? "current-password" : "new-password"} className="field auth-field pl-9 relative z-10 pointer-events-auto select-text" placeholder="--------" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={isLogin ? 1 : 8} />
 </div>
 {!isLogin && <p className="mt-1 text-xs text-[#334155]">At least 8 characters.</p>}
 </div>

 {error && <p className="rounded-zed bg-red-50/70 px-4 py-3 text-sm text-red-700 backdrop-blur-sm">{error}</p>}

 <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-zed bg-zed-950 py-3.5 text-sm font-bold uppercase tracking-wider text-white disabled:opacity-50">
 {loading ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
 {isLogin ? "Log in" : "Create account"}
 </button>

 <p className="pt-1 text-center text-sm text-[#334155]">
 {isLogin ? (
 <>
 New to ZED? <Link className="font-semibold text-soft-sage underline underline-offset-2" href={`/register${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`}>Create an account</Link>
 </>
 ) : (
 <>
 Already have an account? <Link className="font-semibold text-soft-sage underline underline-offset-2" href={`/login${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`}>Log in</Link>
 </>
 )}
 </p>

 {isLogin && (
 <p className="text-center text-xs">
 <Link className="text-[#334155] underline underline-offset-2 hover:text-soft-sage" href="/forgot-password">Forgot your password?</Link>
 </p>
 )}
 </form>
 </div>
 );
}