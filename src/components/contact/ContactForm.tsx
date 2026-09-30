"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { showToast } from "@/lib/toast";

export function ContactForm() {
 const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
 const [busy, setBusy] = useState(false);
 const [done, setDone] = useState(false);
 const [error, setError] = useState<string | null>(null);

 async function submit(e: React.FormEvent) {
 e.preventDefault();
 setBusy(true);
 setError(null);
 const res = await fetch("/api/contact", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(form),
 });
 const data = (await res.json()) as { error?: string };
 if (!res.ok) {
 setError(data.error ?? "Couldn't send your message. Please try again.");
 setBusy(false);
 return;
 }
 setDone(true);
 setBusy(false);
 showToast("Message sent - we'll reply within one working day", "success");
 }

 if (done) {
 return (
 <div className="glass-card rounded-zed border border-emerald-200/60 bg-emerald-50/60 p-8 text-center">
 <p className="font-display text-lg font-bold text-emerald-800">Message sent!</p>
 <p className="mt-2 text-sm text-emerald-700">
 Thanks for reaching out. We&apos;ll get back to you within one working day. For anything urgent, WhatsApp us or call.
 </p>
 </div>
 );
 }

 return (
 <form onSubmit={submit} className="glass-card space-y-4 rounded-zed p-6 sm:p-8">
 <div className="grid gap-4 sm:grid-cols-2">
 <div>
 <label className="label" htmlFor="cf-name">Full name</label>
 <input id="cf-name" className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} />
 </div>
 <div>
 <label className="label" htmlFor="cf-phone">Phone (optional)</label>
 <input id="cf-phone" className="field" placeholder="+2547..." value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
 </div>
 <div>
 <label className="label" htmlFor="cf-email">Email</label>
 <input id="cf-email" type="email" className="field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
 </div>
 <div>
 <label className="label" htmlFor="cf-subject">Subject</label>
 <input id="cf-subject" className="field" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required minLength={2} />
 </div>
 </div>
 <div>
 <label className="label" htmlFor="cf-message">Message</label>
 <textarea id="cf-message" rows={6} className="field resize-y" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required minLength={5} />
 </div>
 {error && <p className="rounded-zed bg-red-50/70 px-4 py-3 text-sm text-red-700 backdrop-blur-sm">{error}</p>}
 <button type="submit" disabled={busy} className="flex items-center gap-2 rounded-zed bg-zed-950 px-6 py-3 text-sm font-bold text-white disabled:opacity-50">
 {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Send message
 </button>
 </form>
 );
}