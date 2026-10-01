"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus, ShieldCheck, ShoppingBag, Sparkles, Truck } from "lucide-react";
import { formatKES } from "@/lib/utils";

type Variant = { id: string; name: string; value: string; priceOffset: number; inStock: boolean };
type WrapOption = { id: string; name: string; price: number; active: boolean };

export function ProductPurchase({
 productId,
 slug,
 basePrice,
 compareAtPrice,
 variants,
 personalizationFields,
 giftWrapOptions,
 giftWrapAvailable,
 giftMessageAvailable,
 inStock,
}: {
 productId: string;
 slug: string;
 basePrice: number;
 compareAtPrice: number | null;
 variants: Variant[];
 personalizationFields: { key: string; label: string; type: string; required?: boolean; maxLength?: number }[];
 giftWrapOptions: WrapOption[];
 giftWrapAvailable: boolean;
 giftMessageAvailable: boolean;
 inStock: boolean;
}) {
 const router = useRouter();
 const [selections, setSelections] = useState<Record<string, string>>({});
 const [quantity, setQuantity] = useState(1);
 const [personalization, setPersonalization] = useState<Record<string, string>>({});
 const [wrapId, setWrapId] = useState<string>(giftWrapOptions[0]?.id ?? "");
 const [giftMessage, setGiftMessage] = useState({ message: "", from: "", to: "" });
 const [useGiftMessage, setUseGiftMessage] = useState(false);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const variantGroups: { name: string; values: Variant[] }[] = [];
 for (const v of variants) {
 let group = variantGroups.find((g) => g.name === v.name);
 if (!group) {
 group = { name: v.name, values: [] };
 variantGroups.push(group);
 }
 group.values.push(v);
 }

 const allGroupsSelected = variantGroups.every((g) => selections[g.name]);
 const selectedVariant =
 (allGroupsSelected ? variants.find((v) => variantGroups.every((g) => selections[g.name] === v.value)) : null) ??
 variants[0] ??
 null;

 const price = basePrice + (selectedVariant?.priceOffset ?? 0);
 const wrap = giftWrapOptions.find((w) => w.id === wrapId);

 async function addToCart() {
 if (busy) return;
 setBusy(true);
 setError(null);
 const payload: Record<string, unknown> = { productId, quantity };
 if (Object.keys(selections).length > 0 && !allGroupsSelected) {
 setError("Please select all options.");
 setBusy(false);
 return;
 }
 if (selectedVariant && allGroupsSelected) payload.variantId = selectedVariant.id;

 const personalizationEntries = Object.entries(personalization).filter(([, v]) => String(v).trim());
 if (personalizationEntries.length > 0) {
 payload.personalization = Object.fromEntries(personalizationEntries);
 }
 if (wrap && giftWrapAvailable) {
 payload.giftWrap = { id: wrap.id, name: wrap.name, price: wrap.price };
 }
 if (useGiftMessage && giftMessage.message.trim()) {
 payload.giftMessage = {
 message: giftMessage.message.trim(),
 from: giftMessage.from.trim() || undefined,
 to: giftMessage.to.trim() || undefined,
 };
 }

 try {
 const res = await fetch("/api/cart/items", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(payload),
 });
 const data = (await res.json()) as { ok?: boolean; error?: string };
 if (!res.ok || !data.ok) {
 setError(data.error ?? "Could not add to cart.");
 return;
 }
 window.dispatchEvent(new CustomEvent("zed:open-cart"));
 router.refresh();
 } finally {
 setBusy(false);
 }
 }

 return (
 <div className="space-y-6">
 {/* Views & reviews summary */}
 <div className="flex items-center gap-3 text-sm text-[#6B6B6B]">
 <span className="flex items-center gap-1 text-[#171717]">
 <Sparkles className="size-4 text-soft-sage" /> Available online
 </span>
 <span className="text-edge-strong">|</span>
 <span className="flex items-center gap-1">
 <Truck className="size-4 text-soft-sage" /> Same-day Nairobi, countrywide 1-3 days
 </span>
 </div>

 {/* Variants */}
 {variantGroups.map((group) => (
 <div key={group.name}>
 <p className="label">
 {group.name}:{" "}
 <span className="font-semibold text-[#171717]">{selections[group.name] ?? "Select"}</span>
 </p>
 <div className="flex flex-wrap gap-2">
 {group.values.map((v) => {
 const active = selections[group.name] === v.value;
 return (
 <button
 key={v.id}
 type="button"
 onClick={() =>
 setSelections((prev) => ({ ...prev, [group.name]: active ? "" : v.value }))
 }
 disabled={!v.inStock}
 className={`rounded-zed border px-4 py-2.5 text-sm font-semibold backdrop-blur-sm transition-colors ${
 active
 ? "border-soft-sage bg-zed-950 text-white"
 : "border-white/50 bg-white/30 text-[#171717] hover:border-soft-sage"
 } ${!v.inStock ? "cursor-not-allowed opacity-40" : ""}`}
 >
 {v.value}
 {v.priceOffset > 0 && (
 <span className="ml-1 text-xs opacity-70">+{formatKES(v.priceOffset)}</span>
 )}
 {v.priceOffset < 0 && (
 <span className="ml-1 text-xs opacity-70">-{formatKES(Math.abs(v.priceOffset))}</span>
 )}
 </button>
 );
 })}
 </div>
 </div>
 ))}

 {/* Personalization */}
 {personalizationFields.length > 0 && (
 <div className="rounded-zed border border-zed-900 bg-warm-white p-4">
 <p className="flex items-center gap-2 text-sm font-bold text-[#171717]">
 <Sparkles className="size-4" /> Personalize
 </p>
 <p className="mt-1 text-xs text-[#171717]">
 We engrave or print this exactly as written - double-check spelling.
 </p>
 <div className="mt-3 space-y-3">
 {personalizationFields.map((field) => (
 <div key={field.key}>
 <label className="label" htmlFor={`p-${field.key}`}>
 {field.label}
 {field.required && <span className="text-soft-sage"> *</span>}
 </label>
 {field.type === "textarea" || (field.maxLength ?? 0) > 40 ? (
 <textarea
 id={`p-${field.key}`}
 value={personalization[field.key] ?? ""}
 maxLength={field.maxLength ?? undefined}
 onChange={(e) => setPersonalization((prev) => ({ ...prev, [field.key]: e.target.value }))}
 className="field"
 rows={3}
 />
 ) : (
 <input
 id={`p-${field.key}`}
 value={personalization[field.key] ?? ""}
 maxLength={field.maxLength ?? undefined}
 onChange={(e) => setPersonalization((prev) => ({ ...prev, [field.key]: e.target.value }))}
 className="field"
 />
 )}
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Gift wrap */}
 {giftWrapAvailable && (
 <div>
 <p className="label">Gift wrap (optional)</p>
 <div className="flex flex-wrap gap-2">
 {giftWrapOptions.map((w) => {
 const active = wrapId === w.id;
 return (
 <button
 key={w.id}
 type="button"
 onClick={() => setWrapId(w.id)}
 className={`rounded-zed border px-3.5 py-2 text-left text-sm backdrop-blur-sm transition-colors ${
 active ? "border-soft-sage bg-zed-950 text-white" : "border-white/50 bg-white/30 text-[#171717] hover:border-soft-sage"
 }`}
 >
 <span className="font-semibold">{w.name}</span>
 <span className="ml-1 opacity-70">+{formatKES(w.price)}</span>
 </button>
 );
 })}
 </div>
 </div>
 )}

 {/* Gift message */}
 {giftMessageAvailable && (
 <div>
 <button
 type="button"
 onClick={() => setUseGiftMessage((v) => !v)}
 className="flex items-center gap-2 text-sm font-semibold text-[#171717]"
 >
 <span className={`grid size-5 place-items-center rounded border ${useGiftMessage ? "border-soft-sage bg-zed-950 text-white" : "border-white/60 bg-white/40"}`}>
 {useGiftMessage && <Check className="size-3.5" />}
 </span>
 Include a handwritten-style gift note
 </button>
 {useGiftMessage && (
 <div className="mt-3 grid gap-3">
 <input
 value={giftMessage.to}
 onChange={(e) => setGiftMessage((m) => ({ ...m, to: e.target.value }))}
 placeholder="To (name)"
 className="field"
 aria-label="Gift note recipient"
 />
 <textarea
 value={giftMessage.message}
 onChange={(e) => setGiftMessage((m) => ({ ...m, message: e.target.value }))}
 placeholder="Your message..."
 className="field"
 rows={3}
 maxLength={500}
 aria-label="Gift note message"
 />
 <input
 value={giftMessage.from}
 onChange={(e) => setGiftMessage((m) => ({ ...m, from: e.target.value }))}
 placeholder="From (name)"
 className="field"
 aria-label="Gift note sender"
 />
 </div>
 )}
 </div>
 )}

 {/* Quantity + price + add */}
 <div className="flex flex-wrap items-center gap-4">
 <div className="flex items-center rounded-zed border border-edge">
 <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="grid size-11 place-items-center hover:bg-zed-900/5">
 <Minus className="size-4" />
 </button>
 <span className="w-10 text-center font-bold">{quantity}</span>
 <button type="button" aria-label="Increase quantity" onClick={() => setQuantity((q) => Math.min(99, q + 1))} className="grid size-11 place-items-center hover:bg-zed-900/5">
 <Plus className="size-4" />
 </button>
 </div>
 <div className="flex items-baseline gap-2">
 <p className="font-display text-3xl font-black text-[#171717]">{formatKES(price * quantity)}</p>
 {compareAtPrice != null && compareAtPrice > basePrice && (
 <p className="text-lg text-[#6B6B6B] line-through">{formatKES(compareAtPrice * quantity)}</p>
 )}
 </div>
 </div>

 <div className="max-w-sm">
 {inStock ? (
 <button
 type="button"
 onClick={addToCart}
 disabled={busy}
 className="inline-flex w-full items-center justify-center gap-2 rounded-zed bg-zed-950 px-6 py-4 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-zed-950 hover:text-white disabled:opacity-60"
 >
 <ShoppingBag className="size-4" />
 {busy ? "Adding..." : "Add to cart"}
 </button>
 ) : (
 <p className="rounded-zed glass-panel px-6 py-4 text-center text-sm font-bold text-[#6B6B6B]">
 Currently out of stock
 </p>
 )}
 {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
 <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-[#6B6B6B]">
 <ShieldCheck className="size-4 text-soft-sage" /> Secure M-PESA checkout | Free gift box with every order
 </p>
 <p className="mt-1 text-center text-xs text-[#6B6B6B]">Free in Nairobi on this item.</p>
 </div>
 </div>
 );
}