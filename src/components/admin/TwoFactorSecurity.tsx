"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, KeyRound, Loader2, ShieldCheck, ShieldOff } from "lucide-react";

type Status = { enabled: boolean; pending: boolean };
type Setup = { secret: string; backupCodes: string[] };

export function TwoFactorSecurity() {
 const [status, setStatus] = useState<Status | null>(null);
 const [setup, setSetup] = useState<Setup | null>(null);
 const [code, setCode] = useState("");
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState("");
 const [copied, setCopied] = useState(false);

 const load = useCallback(async () => {
 try {
 const res = await fetch("/api/auth/two-factor", { credentials: "include" });
 const data = (await res.json()) as Status;
 if (res.ok) setStatus(data);
 } catch {
 setStatus({ enabled: false, pending: false });
 }
 }, []);

 useEffect(() => {
 void load();
 }, [load]);

 async function start() {
 setBusy(true);
 setError("");
 setSetup(null);
 setCode("");
 try {
 const res = await fetch("/api/auth/two-factor", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 credentials: "include",
 body: JSON.stringify({ action: "setup" }),
 });
 const data = (await res.json()) as Setup & { error?: string };
 if (!res.ok || !data.secret) {
 setError(data.error ?? "Could not start setup.");
 return;
 }
 setSetup(data);
 } catch {
 setError("Could not start setup.");
 } finally {
 setBusy(false);
 }
 }

 async function confirm() {
 setBusy(true);
 setError("");
 try {
 const res = await fetch("/api/auth/two-factor", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 credentials: "include",
 body: JSON.stringify({ action: "confirm", code: code.trim() }),
 });
 const data = (await res.json()) as { ok?: boolean; error?: string };
 if (!res.ok || !data.ok) {
 setError(data.error ?? "That code doesn't match.");
 return;
 }
 setSetup(null);
 setCode("");
 setStatus({ enabled: true, pending: false });
 } catch {
 setError("Could not confirm.");
 } finally {
 setBusy(false);
 }
 }

 async function disable() {
 setBusy(true);
 setError("");
 try {
 const res = await fetch("/api/auth/two-factor", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 credentials: "include",
 body: JSON.stringify({ action: "disable" }),
 });
 if (!res.ok) {
 setError("Could not turn off two-factor authentication.");
 return;
 }
 setStatus({ enabled: false, pending: false });
 } catch {
 setError("Could not turn off two-factor authentication.");
 } finally {
 setBusy(false);
 }
 }

 function copySecret() {
 if (!setup) return;
 void navigator.clipboard?.writeText(setup.secret).then(() => {
 setCopied(true);
 setTimeout(() => setCopied(false), 1500);
 });
 }

 return (
 <section className="glass-card rounded-zed p-5">
 <div className="flex items-center gap-2">
 <KeyRound className="size-5 text-soft-sage" />
 <h2 className="font-display text-lg font-bold text-[var(--color-ink)]">Two-factor authentication</h2>
 </div>
 <p className="mt-1 text-sm text-[rgba(48,37,34,0.62)]">
 Require a code from an authenticator app when signing into this admin account.
 </p>

 {status === null ? (
 <p className="mt-4 flex items-center gap-2 text-sm text-[rgba(48,37,34,0.62)]">
 <Loader2 className="size-4 animate-spin" /> Checking your settings…
 </p>
 ) : status.enabled ? (
 <div className="mt-4 space-y-3">
 <p className="flex items-center gap-2 text-sm font-semibold text-soft-sage">
 <ShieldCheck className="size-4" /> Two-factor authentication is on for this account.
 </p>
 <button
 onClick={disable}
 disabled={busy}
 className="inline-flex items-center gap-2 rounded-zed bg-zed-950 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
 >
 <ShieldOff className="size-4" /> Turn off 2FA
 </button>
 </div>
 ) : (
 <div className="mt-4 space-y-4">
 {!setup ? (
 <button
 onClick={start}
 disabled={busy}
 className="inline-flex items-center gap-2 rounded-zed bg-zed-950 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
 >
 {busy ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />} Set up 2FA
 </button>
 ) : (
 <div className="space-y-3">
 <div>
 <p className="label">1. Add this secret to your authenticator app</p>
 <div className="flex items-center gap-2">
 <code className="flex-1 rounded-lg bg-warm-white px-3 py-2 text-sm tracking-wider text-[var(--color-ink)]">
 {setup.secret.replace(/(.{4})(?=.)/g, "$1 ")}
 </code>
 <button
 type="button"
 onClick={copySecret}
 className="grid size-10 shrink-0 place-items-center rounded-lg border border-black/10 text-[rgba(48,37,34,0.62)] hover:text-soft-sage"
 aria-label="Copy secret"
 >
 {copied ? <Check className="size-4 text-soft-sage" /> : <Copy className="size-4" />}
 </button>
 </div>
 <p className="mt-1 text-xs text-[rgba(48,37,34,0.62)]">
 You can also scan the QR code in your app, or type the secret above. Codes change every 30 seconds.
 </p>
 </div>
 <div>
 <p className="label">2. Save these one-time backup codes</p>
 <div className="grid gap-1 rounded-lg bg-warm-white p-3 sm:grid-cols-2">
 {setup.backupCodes.map((c) => (
 <code key={c} className="text-sm text-[var(--color-ink)]">{c}</code>
 ))}
 </div>
 <p className="mt-1 text-xs text-[rgba(48,37,34,0.62)]">
 Each code works once if you lose your phone. Store them somewhere safe.
 </p>
 </div>
 <div>
 <label className="label" htmlFor="two-factor-code">3. Enter a code to finish</label>
 <div className="flex gap-2">
 <input
 id="two-factor-code"
 value={code}
 onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
 inputMode="numeric"
 autoComplete="one-time-code"
 placeholder="123456"
 className="field flex-1"
 />
 <button
 onClick={confirm}
 disabled={busy || code.length !== 6}
 className="rounded-zed bg-zed-950 px-5 text-sm font-bold text-white disabled:opacity-60"
 >
 {busy ? "Verifying…" : "Turn on"}
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 )}

 {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
 </section>
 );
}
