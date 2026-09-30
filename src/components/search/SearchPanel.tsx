"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, Loader2, Search, X } from "lucide-react";
import { formatKES } from "@/lib/utils";

type Suggestion = {
 id: string;
 slug: string;
 name: string;
 price: number;
 image: string | null;
 category: string | null;
 categorySlug: string | null;
};
type CategoryHit = { name: string; slug: string };

const POPULAR = ["Birthday", "For Her", "For Him", "Anniversary", "Corporate", "Personalized"];

export function SearchPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
 const router = useRouter();
 const [q, setQ] = useState("");
 const [results, setResults] = useState<Suggestion[]>([]);
 const [categoryHits, setCategoryHits] = useState<CategoryHit[]>([]);
 const [loading, setLoading] = useState(false);
 const [recent, setRecent] = useState<string[]>([]);
 const inputRef = useRef<HTMLInputElement>(null);
 const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

 useEffect(() => {
 if (open) {
 setQ("");
 setResults([]);
 setCategoryHits([]);
 setRecent(JSON.parse(localStorage.getItem("zed_recent_search") ?? "[]") as string[]);
 window.setTimeout(() => inputRef.current?.focus(), 60);
 }
 }, [open]);

 useEffect(() => {
 if (!open) return;
 function onKey(e: KeyboardEvent) {
 if (e.key === "Escape") onClose();
 }
 window.addEventListener("keydown", onKey);
 document.body.style.overflow = "hidden";
 return () => {
 window.removeEventListener("keydown", onKey);
 document.body.style.overflow = "";
 };
 }, [open, onClose]);

 function remember(term: string) {
 const cleaned = term.trim();
 if (!cleaned) return;
 const next = [cleaned, ...recent.filter((r) => r.toLowerCase() !== cleaned.toLowerCase())].slice(0, 6);
 localStorage.setItem("zed_recent_search", JSON.stringify(next));
 setRecent(next);
 }

 function submit(term: string) {
 const value = term.trim();
 if (!value) return;
 remember(value);
 onClose();
 router.push(`/search?q=${encodeURIComponent(value)}`);
 }

 async function fetchSuggests(query: string) {
 const value = query.trim();
 if (!value) {
 setResults([]);
 setCategoryHits([]);
 setLoading(false);
 return;
 }
 if (timer.current) clearTimeout(timer.current);
 timer.current = setTimeout(async () => {
 setLoading(true);
 try {
 const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(value)}`, { cache: "no-store" });
 const data = (await res.json()) as { results: Suggestion[]; categories: CategoryHit[] };
 setResults(data.results ?? []);
 setCategoryHits((data.categories ?? []).slice(0, 3));
 } catch {
 setResults([]);
 setCategoryHits([]);
 } finally {
 setLoading(false);
 }
 }, 180);
 }

 if (!open) return null;

 return (
 <div className="fixed inset-0 z-[80]">
 <div className="absolute inset-0 bg-zed-950/30 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden />
 <div className="absolute inset-x-0 top-0 animate-[slide-up_0.35s_cubic-bezier(0.16,1,0.3,1)_both]">
 <div className="container-zed py-5 sm:py-8">
 <div className="glass-strong rounded-3xl p-5 shadow-glass-lg sm:p-6">
 <form
 onSubmit={(e) => {
 e.preventDefault();
 submit(q);
 }}
 className="flex items-center gap-3"
 >
 <Search className="size-5 shrink-0 text-soft-sage" />
 <input
 ref={inputRef}
 value={q}
 onChange={(e) => {
 setQ(e.target.value);
 fetchSuggests(e.target.value);
 }}
 placeholder="Search gifts, occasions, recipients..."
 aria-label="Search products"
 className="w-full border-none bg-transparent text-lg text-[#171717] placeholder:text-[#6B6B6B] focus:outline-none"
 />
 <button type="button" onClick={onClose} aria-label="Close search" className="grid size-9 shrink-0 place-items-center rounded-zed hover:bg-zed-900/5">
 <X className="size-5" />
 </button>
 </form>

 {!q.trim() ? (
 <div className="mt-5 grid gap-6 sm:grid-cols-2">
 {recent.length > 0 && (
 <div>
 <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B6B6B]">
 <Clock className="size-3.5" /> Recent searches
 </p>
 <div className="flex flex-wrap gap-2">
 {recent.map((r) => (
 <button key={r} type="button" onClick={() => submit(r)} className="rounded-full bg-zed-900/5 px-3 py-1.5 text-sm text-[#171717] hover:bg-zed-900/10">
 {r}
 </button>
 ))}
 </div>
 </div>
 )}
 <div>
 <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B6B6B]">Popular</p>
 <div className="flex flex-wrap gap-2">
 {POPULAR.map((t) => (
 <button key={t} type="button" onClick={() => submit(t)} className="rounded-full border border-white/60 bg-white/50 px-3 py-1.5 text-sm text-[#171717] hover:border-soft-sage hover:text-[#171717]">
 {t}
 </button>
 ))}
 </div>
 </div>
 </div>
 ) : (
 <div className="mt-4 min-h-24">
 {loading && (
 <p className="flex items-center gap-2 py-6 text-sm text-[#6B6B6B]">
 <Loader2 className="size-4 animate-spin" /> Searching...
 </p>
 )}
 {!loading && results.length === 0 && (
 <p className="py-6 text-sm text-[#6B6B6B]">
 No matches for <span className="font-semibold text-[#171717]">&ldquo;{q}&rdquo;</span>. Press Enter to browse all results.
 </p>
 )}
 {categoryHits.map((c) => (
 <button key={c.slug} type="button" onClick={() => submit(c.name)} className="mb-1 flex items-center gap-2 rounded-zed px-2 py-1.5 text-sm text-deep-olive hover:bg-zed-900/5">
 <Search className="size-3.5" /> Category | {c.name}
 </button>
 ))}
 <ul className="divide-y divide-white/40">
 {results.map((p) => (
 <li key={p.id}>
 <Link href={`/product/${p.slug}`} onClick={() => { remember(p.name); onClose(); }} className="flex items-center gap-3 rounded-zed px-2 py-2.5 hover:bg-zed-900/5">
 <span className="relative block size-11 shrink-0 overflow-hidden rounded-zed bg-white/60">
 {p.image ? <Image src={p.image} alt="" fill sizes="44px" unoptimized className="object-cover" /> : null}
 </span>
 <span className="min-w-0 flex-1">
 <span className="block truncate text-sm font-medium text-[#171717]">{p.name}</span>
 <span className="block text-xs text-[#6B6B6B]">{p.category ?? "Gift"}</span>
 </span>
 <span className="shrink-0 text-sm font-bold text-[#171717]">{formatKES(p.price)}</span>
 </Link>
 </li>
 ))}
 </ul>
 {results.length > 0 && (
 <button type="button" onClick={() => submit(q)} className="mt-3 block w-full rounded-zed bg-zed-950 py-2.5 text-center text-sm font-bold text-white hover:bg-zed-900">
 See all results for &ldquo;{q}&rdquo;
 </button>
 )}
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 );
}