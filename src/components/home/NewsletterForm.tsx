"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { showToast } from "@/lib/toast";

export function NewsletterForm() {
 const [email, setEmail] = useState("");
 const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
 const [message, setMessage] = useState("");

 async function submit(e: React.FormEvent) {
 e.preventDefault();
 if (state === "busy") return;
 setState("busy");
 setMessage("");
 try {
 const res = await fetch("/api/newsletter", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ email }),
 });
 const data = (await res.json()) as { ok?: boolean; error?: string };
 if (res.ok && data.ok) {
 setState("done");
 setEmail("");
 showToast("You're in - welcome gift code on its way", "success");
 } else {
 setState("error");
 setMessage(data.error ?? "Something went wrong. Try again.");
 }
 } catch {
 setState("error");
 showToast("Could not subscribe right now", "error");
 }
 }

 if (state === "done") {
 return (
 <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-2 rounded-zed bg-zed-950 px-6 py-4 text-sm font-bold text-[#171717]">
 <Check className="size-5" /> You&apos;re in - check your inbox for a welcome gift code.
 </div>
 );
 }

 return (
 <div className="mx-auto mt-6 max-w-md">
 <form onSubmit={submit} className="flex gap-2">
 <input
 type="email"
 required
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 placeholder="you@example.com"
 aria-label="Email address"
 className="w-full rounded-zed border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:border-zed-900 focus:outline-none"
 />
 <button
 type="submit"
 disabled={state === "busy"}
 className="shrink-0 rounded-zed bg-zed-950 px-5 py-3 text-sm font-bold text-[#171717] transition-colors hover:bg-white disabled:opacity-60"
 >
 {state === "busy" ? "Joining..." : "Join"}
 </button>
 </form>
 {state === "error" && <p className="mt-2 text-sm text-white">{message}</p>}
 </div>
 );
}