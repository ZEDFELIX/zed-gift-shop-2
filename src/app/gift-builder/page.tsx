"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2, Package, Sparkles, X } from "lucide-react";
import { formatKES } from "@/lib/utils";

type BuilderItem = {
 id: string;
 slug: string;
 name: string;
 image: string | null;
 price: number;
 compareAtPrice: number | null;
 personalizationEnabled: boolean;
 inStock: boolean;
};

const OCCASIONS = [
 { value: "birthday", label: "Birthday", emoji: "" },
 { value: "anniversary", label: "Anniversary", emoji: "" },
 { value: "graduation", label: "Graduation", emoji: "" },
 { value: "corporate", label: "Corporate", emoji: "" },
 { value: "valentines", label: "Valentine's", emoji: "" },
 { value: "just-because", label: "Just because", emoji: "" },
];

const RECIPIENTS = [
 { value: "", label: "Anyone" },
 { value: "for-him", label: "For him" },
 { value: "for-her", label: "For her" },
 { value: "for-couples", label: "For couples" },
 { value: "for-friends", label: "For friends" },
 { value: "for-parents", label: "For parents" },
 { value: "for-colleagues", label: "For colleagues" },
];

const BUDGETS = [
 { value: 1000, label: "Under KES 1,000" },
 { value: 2500, label: "Under KES 2,500" },
 { value: 5000, label: "Under KES 5,000" },
 { value: 999999, label: "No limit" },
];

const VIBES = [
 { value: "featured", label: "Popular picks" },
 { value: "price-asc", label: "Budget first" },
 { value: "rating", label: "Best rated" },
];

export default function GiftBuilder() {
 const router = useRouter();
 const [step, setStep] = useState(0);
 const [occasion, setOccasion] = useState("");
 const [recipient, setRecipient] = useState("");
 const [budget, setBudget] = useState(2500);
 const [vibe, setVibe] = useState("featured");
 const [items, setItems] = useState<BuilderItem[]>([]);
 const [selected, setSelected] = useState<Set<string>>(new Set());
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [adding, setAdding] = useState(false);

 async function suggest() {
 setLoading(true);
 setError(null);
 const params = new URLSearchParams({ budget: String(budget), sort: vibe });
 if (occasion) params.set("occasion", occasion);
 if (recipient) params.set("recipient", recipient);
 try {
 const res = await fetch(`/api/gift-builder?${params.toString()}`);
 const data = (await res.json()) as { items?: BuilderItem[]; error?: string };
 if (!res.ok || !data.items) {
 setError(data.error ?? "Could not load suggestions.");
 return;
 }
 setItems(data.items);
 setSelected(new Set());
 setStep(3);
 } finally {
 setLoading(false);
 }
 }

 function toggle(id: string) {
 setSelected((prev) => {
 const next = new Set(prev);
 if (next.has(id)) next.delete(id);
 else next.add(id);
 return next;
 });
 }

 async function addSelected() {
 const chosen = items.filter((i) => selected.has(i.id));
 if (chosen.length === 0) return;
 setAdding(true);
 setError(null);
 for (const item of chosen) {
 await fetch("/api/cart/items", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ productId: item.id, quantity: 1 }),
 });
 }
 setAdding(false);
 window.dispatchEvent(new CustomEvent("zed:open-cart"));
 router.refresh();
 }

 const selectedItems = items.filter((i) => selected.has(i.id));
 const total = selectedItems.reduce((s, i) => s + i.price, 0);

 return (
 <div className="container-zed py-10 lg:py-14">
 <header className="max-w-2xl">
 <p className="eyebrow">The ZED Gift Builder</p>
 <h1 className="mt-2 font-display text-3xl font-bold text-[#07111F] lg:text-4xl">
 Build a gift, <span className="text-soft-sage">from scratch.</span>
 </h1>
 <p className="mt-3 text-[#07111F]">
 Answer three quick questions and we&apos;ll put together a ready-to-checkout box of ideas.
 </p>
 </header>

 {/* Stepper */}
 <div className="mt-8 flex items-center gap-2">
 {["Occasion", "Recipient", "Budget", "Pick your gifts"].map((label, i) => (
 <div key={label} className="flex items-center gap-2">
 <span
 className={`grid size-7 place-items-center rounded-full text-xs font-bold ${
 i < step || (step === 3 && i === 3) ? "bg-zed-950 text-white" : i === step ? "bg-zed-950 text-white" : "bg-panel text-[#334155]"
 }`}
 >
 {i < step ? <Check className="size-4" /> : i + 1}
 </span>
 <span className={`hidden text-xs font-semibold sm:inline ${i <= step ? "text-[#07111F]" : "text-[#334155]"}`}>{label}</span>
 {i < 3 && <span className="h-px w-6 bg-edge-strong sm:w-10" />}
 </div>
 ))}
 </div>

 {/* Step 0 */}
 {step === 0 && (
 <section className="mt-10">
 <h2 className="font-display text-xl font-bold text-[#07111F]">What are we celebrating?</h2>
 <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
 {OCCASIONS.map((o) => (
 <button
 key={o.value}
 type="button"
 onClick={() => {
 setOccasion(o.value);
 setStep(1);
 }}
 className="glass-card group rounded-zed p-6 text-left transition-all hover:-translate-y-1 hover:shadow-glass-lg"
 >
 <span className="text-3xl">{o.emoji}</span>
 <p className="mt-3 font-display font-bold text-[#07111F]">{o.label}</p>
 </button>
 ))}
 </div>
 </section>
 )}

 {/* Step 1 */}
 {step === 1 && (
 <section className="mt-10">
 <h2 className="font-display text-xl font-bold text-[#07111F]">Who is it for?</h2>
 <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
 {RECIPIENTS.map((r) => (
 <button
 key={r.value}
 type="button"
 onClick={() => {
 setRecipient(r.value);
 setStep(2);
 }}
 className="glass-card rounded-zed p-5 text-center transition-all hover:-translate-y-1 hover:shadow-glass-lg"
 >
 <p className="font-semibold text-[#07111F]">{r.label}</p>
 </button>
 ))}
 </div>
 </section>
 )}

 {/* Step 2 */}
 {step === 2 && (
 <section className="mt-10">
 <h2 className="font-display text-xl font-bold text-[#07111F]">What&apos;s the budget per gift?</h2>
 <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
 {BUDGETS.map((b) => (
 <button
 key={b.value}
 type="button"
 onClick={() => {
 setBudget(b.value);
 setStep(3);
 suggest();
 }}
 className={`rounded-zed border p-6 text-center backdrop-blur-sm transition-colors ${
 budget === b.value ? "border-soft-sage bg-warm-white" : "border-white/50 bg-white/30 hover:border-soft-sage"
 }`}
 >
 <p className="font-bold text-[#07111F]">{b.label}</p>
 </button>
 ))}
 </div>
 <div className="mt-6">
 <p className="eyebrow mb-2">Vibe</p>
 <div className="flex flex-wrap gap-2">
 {VIBES.map((v) => (
 <button
 key={v.value}
 type="button"
 onClick={() => setVibe(v.value)}
 className={`rounded-full border px-4 py-2 text-sm font-semibold backdrop-blur-sm ${
 vibe === v.value ? "border-soft-sage bg-zed-950 text-white" : "border-white/50 bg-white/30 text-[#07111F] hover:border-soft-sage"
 }`}
 >
 {v.label}
 </button>
 ))}
 </div>
 </div>
 <button
 type="button"
 onClick={suggest}
 disabled={loading}
 className="mt-8 inline-flex items-center gap-2 rounded-zed bg-zed-950 px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-zed-900 disabled:opacity-60"
 >
 {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
 {loading ? "Picking gifts..." : "Show me gifts"}
 </button>
 </section>
 )}

 {/* Step 3 */}
 {step === 3 && (
 <section className="mt-10">
 <h2 className="font-display text-xl font-bold text-[#07111F]">Pick the ones you love</h2>
 <p className="mt-1 text-sm text-[#334155]">
 Select up to 5 gifts - we&apos;ll add them all to your cart together.
 </p>

 {error && <p className="mt-4 rounded-zed bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

 <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
 {items.map((item) => {
 const isSelected = selected.has(item.id);
 return (
 <button
 key={item.id}
 type="button"
 onClick={() => toggle(item.id)}
 className={`group relative overflow-hidden rounded-zed border bg-white text-left transition-all ${
 isSelected ? "border-soft-sage ring-2 ring-zed-900" : "border-edge hover:border-soft-sage"
 }`}
 >
 <div className="relative aspect-square bg-panel">
 {item.image ? (
 <Image src={item.image} alt={item.name} fill sizes="(min-width:640px) 300px, 50vw" unoptimized className="object-cover" />
 ) : (
 <span className="grid aspect-square place-items-center font-display text-soft-sage">ZED</span>
 )}
 {!item.inStock && <span className="absolute left-2 top-2 rounded-full bg-ink/85 px-2 py-0.5 text-[10px] font-bold text-white">Out of stock</span>}
 {item.personalizationEnabled && (
 <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-deep-olive">Personalize</span>
 )}
 {isSelected && (
 <span className="absolute left-2 top-2 grid size-7 place-items-center rounded-full bg-zed-950 text-white">
 <Check className="size-4" />
 </span>
 )}
 </div>
 <div className="p-3">
 <p className="text-sm font-semibold leading-snug text-[#07111F]">{item.name}</p>
 <p className="mt-1 text-sm font-bold text-[#07111F]">{formatKES(item.price)}</p>
 </div>
 </button>
 );
 })}
 </div>

 {/* Selection tray */}
 {selectedItems.length > 0 && (
 <div className="sticky bottom-4 mt-8 rounded-zed bg-zed-950 p-4 text-white shadow-raised">
 <div className="flex flex-wrap items-center justify-between gap-4">
 <div className="min-w-0">
 <p className="flex items-center gap-2 text-sm font-bold">
 <Package className="size-4 text-white" /> {selectedItems.length} gift{selectedItems.length === 1 ? "" : "s"} selected
 </p>
 <p className="mt-0.5 text-xs text-white/70">Estimated total {formatKES(total)}</p>
 </div>
 <div className="flex gap-2">
 <button
 type="button"
 onClick={() => setSelected(new Set())}
 className="rounded-zed border border-white/25 px-4 py-2.5 text-sm font-semibold text-white hover:border-zed-900 hover:text-white"
 >
 Clear
 </button>
 <button
 type="button"
 onClick={addSelected}
 disabled={adding || selectedItems.length > 5}
 className="rounded-zed bg-zed-950 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white disabled:opacity-50"
 >
 {adding ? "Adding..." : `Add to cart | ${formatKES(total)}`}
 </button>
 </div>
 </div>
 <div className="mt-3 flex flex-wrap gap-2">
 {selectedItems.map((it) => (
 <span key={it.id} className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs">
 {it.name.slice(0, 28)}
 <button type="button" onClick={() => toggle(it.id)} aria-label={`Remove ${it.name}`} className="text-white/60 hover:text-white">
 <X className="size-3" />
 </button>
 </span>
 ))}
 </div>
 </div>
 )}

 <Link href="/shop" className="mt-4 inline-block text-sm font-semibold text-deep-olive underline-offset-2 hover:underline">
 Browse the full catalogue instead
 </Link>
 </section>
 )}
 </div>
 );
}