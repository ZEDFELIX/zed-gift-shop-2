"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Calendar, Loader2, Plus, Trash2 } from "lucide-react";

type Reminder = {
 id: string;
 personName: string;
 occasion: string;
 date: string;
 relationship: string | null;
 notes: string | null;
 repeatsAnnually: boolean;
};

const OCCASIONS = [
 "BIRTHDAY", "ANNIVERSARY", "WEDDING", "GRADUATION", "VALENTINES",
 "MOTHERS_DAY", "FATHERS_DAY", "CHRISTMAS", "OTHER",
];

const OCCASION_LABELS = {
 BIRTHDAY: "Birthday", ANNIVERSARY: "Anniversary", WEDDING: "Wedding", GRADUATION: "Graduation",
 VALENTINES: "Valentine's Day", MOTHERS_DAY: "Mother's Day", FATHERS_DAY: "Father's Day",
 CHRISTMAS: "Christmas", OTHER: "Other",
} as Record<string, string>;

const empty = { personName: "", occasion: "BIRTHDAY", date: "", relationship: "", notes: "", repeatsAnnually: true };

export function RemindersManager() {
 const [reminders, setReminders] = useState<Reminder[]>([]);
 const [loading, setLoading] = useState(true);
 const [showForm, setShowForm] = useState(false);
 const [form, setForm] = useState(empty);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const load = useCallback(async () => {
 const res = await fetch("/api/account/reminders");
 if (res.ok) {
 const data = (await res.json()) as { reminders: Reminder[] };
 setReminders(data.reminders);
 }
 setLoading(false);
 }, []);

 useEffect(() => {
 load();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);

 function upcomingLabel(date: string): string {
 const d = new Date(date);
 const now = new Date();
 const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
 let target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
 if (target < today) target = new Date(now.getFullYear() + 1, d.getMonth(), d.getDate());
 const ms = target.getTime() - today.getTime();
 const days = Math.round(ms / 86400000);
 if (days === 0) return "Today";
 if (days === 1) return "Tomorrow";
 if (days < 30) return `In ${days} days`;
 return `${OCCASION_LABELS[d.getMonth() === 0 ? d.getMonth() : d.getMonth()] ?? ""} ${d.getDate()} | about ${Math.round(days / 30.4)} months`;
 }

 async function create(e: React.FormEvent) {
 e.preventDefault();
 setBusy(true);
 setError(null);
 const res = await fetch("/api/account/reminders", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(form),
 });
 const data = (await res.json()) as { error?: string };
 if (!res.ok) {
 setError(data.error ?? "Couldn't save the reminder.");
 setBusy(false);
 return;
 }
 setForm(empty);
 setShowForm(false);
 setBusy(false);
 await load();
 }

 async function remove(id: string) {
 await fetch(`/api/account/reminders/${id}`, { method: "DELETE" });
 await load();
 }

 return (
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <p className="text-sm text-[#6B6B6B]">Never miss a day - sit back, we&apos;ll remind you.</p>
 <button type="button" onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5 rounded-zed bg-zed-950 px-4 py-2.5 text-sm font-bold text-white">
 <Plus className="size-4" /> {showForm ? "Cancel" : "Add reminder"}
 </button>
 </div>

 {loading && <p className="flex items-center gap-2 text-sm text-[#6B6B6B]"><Loader2 className="size-4 animate-spin" /> Loading...</p>}

 {showForm && (
 <form onSubmit={create} className="glass-card grid gap-4 rounded-zed p-5 sm:grid-cols-2">
 <div>
 <label className="label" htmlFor="rm-name">Person&apos;s name</label>
 <input id="rm-name" className="field" value={form.personName} onChange={(e) => setForm({ ...form, personName: e.target.value })} required />
 </div>
 <div>
 <label className="label" htmlFor="rm-occasion">Occasion</label>
 <select id="rm-occasion" className="field" value={form.occasion} onChange={(e) => setForm({ ...form, occasion: e.target.value })}>
 {OCCASIONS.map((o) => <option key={o} value={o}>{OCCASION_LABELS[o]}</option>)}
 </select>
 </div>
 <div>
 <label className="label" htmlFor="rm-date">Date</label>
 <input id="rm-date" type="date" className="field" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
 </div>
 <div>
 <label className="label" htmlFor="rm-relationship">Relationship</label>
 <input id="rm-relationship" className="field" placeholder="Sister, husband..." value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} />
 </div>
 <div className="sm:col-span-2">
 <label className="label" htmlFor="rm-notes">Notes (gift ideas!)</label>
 <input id="rm-notes" className="field" placeholder="Loves coffee & candles" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
 </div>
 <label className="flex items-center gap-2 text-sm text-[#171717] sm:col-span-2">
 <input type="checkbox" checked={form.repeatsAnnually} onChange={(e) => setForm({ ...form, repeatsAnnually: e.target.checked })} className="size-4 accent-deep-olive" />
 Remind me every year on this date
 </label>
 {error && <p className="rounded-zed bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">{error}</p>}
 <button type="submit" disabled={busy} className="flex items-center justify-center gap-2 rounded-zed bg-zed-950 py-3 text-sm font-bold text-white disabled:opacity-50 sm:col-span-2">
 {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Save reminder
 </button>
 </form>
 )}

 {reminders.length === 0 && !loading && (
 <div className="rounded-zed border border-dashed border-edge p-10 text-center text-sm text-[#6B6B6B]">
 <Bell className="mx-auto mb-2 size-8 text-soft-sage/50" />
 No reminders yet. Add birthdays and anniversaries - we&apos;ll email you before each one.
 </div>
 )}

 <ul className="space-y-3">
 {reminders.map((r) => (
 <li key={r.id} className="glass-card flex items-start justify-between gap-3 rounded-zed p-5">
 <div className="flex items-start gap-3">
 <span className="grid size-10 shrink-0 place-items-center rounded-full bg-warm-white text-deep-olive">
 <Calendar className="size-5" />
 </span>
 <div>
 <p className="font-semibold text-[#171717]">
 {r.personName}
 <span className="ml-2 rounded-full bg-panel px-2 py-0.5 text-[11px] font-bold text-deep-olive">{OCCASION_LABELS[r.occasion] ?? r.occasion}</span>
 </p>
 <p className="mt-0.5 text-sm text-[#6B6B6B]">
 <span className="font-semibold text-soft-sage">{upcomingLabel(r.date)}</span> | every year{r.relationship ? ` | ${r.relationship}` : ""}
 </p>
 {r.notes && <p className="mt-1 text-sm italic text-[#6B6B6B]">&ldquo;{r.notes}&rdquo;</p>}
 </div>
 </div>
 <button type="button" onClick={() => remove(r.id)} className="rounded-zed border border-red-100 p-2 text-red-500 hover:bg-red-50" aria-label="Delete reminder">
 <Trash2 className="size-4" />
 </button>
 </li>
 ))}
 </ul>
 </div>
 );
}