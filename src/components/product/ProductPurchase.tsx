"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus, ShieldCheck, ShoppingBag, Sparkles, MessageCircle } from "lucide-react";
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
  productName,
  whatsappNumber,
  productImage,
  productUrl,
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
  productName?: string;
  whatsappNumber?: string;
  productImage?: string;
  productUrl?: string;
}) {
 const router = useRouter();
 const [selections, setSelections] = useState<Record<string, string>>({});
 const [quantity, setQuantity] = useState(1);
 const [personalization, setPersonalization] = useState<Record<string, string>>({});
 const [wrapId, setWrapId] = useState<string>("");
 const [giftMessage, setGiftMessage] = useState({ message: "", from: "", to: "" });
 const [useGiftMessage, setUseGiftMessage] = useState(false);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const shareFileRef = useRef<File | null>(null);

 useEffect(() => {
  if (!productImage) return;
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  if (!nav?.share || !nav.canShare) return;
  let cancelled = false;
  (async () => {
   try {
    const res = await fetch(productImage, { mode: "cors", credentials: "omit" });
    if (!res.ok) return;
    const blob = await res.blob();
    if (!blob.type.startsWith("image/")) return;
    const ext = (blob.type.split("/")[1] || "jpg").split("+")[0].replace("jpeg", "jpg");
    const file = new File([blob], `zed-gift-${slug}.${ext}`, { type: blob.type });
    if (!cancelled && nav.canShare({ files: [file] })) shareFileRef.current = file;
   } catch {
    /* cross-origin or unsupported — fall back to the WhatsApp link */
   }
  })();
  return () => {
   cancelled = true;
  };
 }, [productImage, slug]);

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
 const missingRequired = personalizationFields.find(
  (field) => field.required && !String(personalization[field.key] ?? "").trim(),
 );
 if (missingRequired) {
  setError(`Please enter ${missingRequired.label.toLowerCase()}.`);
  setBusy(false);
  return;
 }
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
  try {
    const { trackEvent } = await import("@/lib/analytics");
    trackEvent("add_to_cart", {
      currency: "KES",
      value: price * quantity,
      items: [{ item_id: productId, item_name: productName ?? slug, quantity }],
    });
  } catch {
    // Analytics must never break shopping.
  }
  window.dispatchEvent(new CustomEvent("zed:open-cart"));
 router.refresh();
  } finally {
  setBusy(false);
  }
  }

  const orderLine = `Hello ZED Gift Shop, I'd like to order: ${productName ?? "this gift"} - ${formatKES(
  price,
  )} x ${quantity}`;
  const shareCaption = [
    orderLine,
    productUrl ? `Product page: ${productUrl}` : "",
    productImage ? `Product image: ${productImage}` : "",
  ].filter(Boolean).join("\n\n");
  // The image URL is included in both the native share text and WhatsApp's prefilled message.
  // When the browser supports file sharing, the native share sheet can attach the actual image too.
  const waMessage = shareCaption;

  async function orderOnWhatsApp() {
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  const file = shareFileRef.current;
  if (file && nav?.share && nav.canShare?.({ files: [file] })) {
  try {
  await nav.share({ files: [file], text: shareCaption, title: productName ?? "ZED Gift Shop" });
  return;
  } catch (err) {
  if (err instanceof DOMException && err.name === "AbortError") return;
  }
  }
  window.open(
  `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(waMessage)}`,
  "_blank",
  "noopener,noreferrer",
  );
  }

 return (
 <div className="space-y-4 pb-24 md:space-y-6 md:pb-0">
  {/* Views & reviews summary */}
  <div className="hidden items-center gap-3 text-sm text-[#334155] md:flex">
  <span className="flex items-center gap-1 text-[#07111F]">
  <Sparkles className="size-4 text-soft-sage" /> Available online
  </span>
  </div>

 {/* Variants */}
 {variantGroups.map((group) => (
 <div key={group.name}>
 <p className="label">
 {group.name}:{" "}
 <span className="font-semibold text-[#07111F]">{selections[group.name] ?? "Select"}</span>
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
  className={`rounded-zed border px-4 py-3 text-sm font-semibold backdrop-blur-sm transition-colors ${
  active
  ? "border-soft-sage bg-zed-950 text-white"
  : "border-white/50 bg-white/30 text-[#07111F] hover:border-soft-sage"
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
 <p className="flex items-center gap-2 text-sm font-bold text-[#07111F]">
 <Sparkles className="size-4" /> Personalize
 </p>
  <p className="mt-1 text-xs text-[#07111F]">
  Printed exactly as written - check spelling.
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

    {Object.values(personalization).some((v) => String(v).trim()) && (
      <div className="mt-4 rounded-zed border border-soft-sage/40 bg-white p-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-soft-sage">Live preview</p>
        <div className="mt-2 flex items-center gap-3">
          {productImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={productImage} alt="" className="size-20 shrink-0 rounded-lg object-cover" />
          ) : null}
          <div style={{ fontFamily: "Georgia, 'Times New Roman', serif" }} className="text-sm italic text-[#07111F]">
            {personalizationFields.map((f) =>
              personalization[f.key]?.trim() ? (
                <p key={f.key} className="leading-snug">{personalization[f.key]}</p>
              ) : null,
            )}
          </div>
        </div>
      </div>
    )}
  </div>
  )}

  {/* Gift wrap */}
 {giftWrapAvailable && giftWrapOptions.length > 0 && (
 <div>
 <p className="label">Gift wrap (optional)</p>
 <div className="flex flex-wrap gap-2">
 <button
  type="button"
  onClick={() => setWrapId("")}
  className={`rounded-zed border px-3.5 py-3 text-left text-sm backdrop-blur-sm transition-colors ${
   !wrapId ? "border-soft-sage bg-zed-950 text-white" : "border-white/50 bg-white/30 text-[#07111F] hover:border-soft-sage"
  }`}
 >
  No gift wrap
 </button>
 {giftWrapOptions.map((w) => {
 const active = wrapId === w.id;
 return (
  <button
  key={w.id}
  type="button"
  onClick={() => setWrapId(w.id)}
  className={`rounded-zed border px-3.5 py-3 text-left text-sm backdrop-blur-sm transition-colors ${
  active ? "border-soft-sage bg-zed-950 text-white" : "border-white/50 bg-white/30 text-[#07111F] hover:border-soft-sage"
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
 className="flex items-center gap-2 text-sm font-semibold text-[#07111F]"
 >
 <span className={`grid size-5 place-items-center rounded border ${useGiftMessage ? "border-soft-sage bg-zed-950 text-white" : "border-white/60 bg-white/40"}`}>
 {useGiftMessage && <Check className="size-3.5" />}
 </span>
  Include a gift note
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
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div className="flex items-center rounded-zed border border-edge">
 <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="grid size-11 place-items-center hover:bg-zed-900/5">
 <Minus className="size-4" />
 </button>
 <span className="w-10 text-center font-bold">{quantity}</span>
 <button type="button" aria-label="Increase quantity" onClick={() => setQuantity((q) => Math.min(99, q + 1))} className="grid size-11 place-items-center hover:bg-zed-900/5">
 <Plus className="size-4" />
 </button>
 </div>
 <div className="hidden items-baseline gap-2 md:flex">
 <p className="font-display text-[22px] font-black text-[#07111F] sm:text-3xl">{formatKES(price * quantity)}</p>
 {compareAtPrice != null && compareAtPrice > basePrice && (
 <p className="text-lg text-[#334155] line-through">{formatKES(compareAtPrice * quantity)}</p>
 )}
 </div>
 </div>

 <div className="hidden max-w-sm md:block">
  {inStock ? (
    <button
      type="button"
      onClick={addToCart}
      disabled={busy}
      className="inline-flex w-full items-center justify-center gap-2 rounded-zed bg-zed-950 px-5 py-3 text-[13px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-zed-950 hover:text-white disabled:opacity-60"
    >
      <ShoppingBag className="size-4" />
      {busy ? "Adding…" : "Add to cart"}
    </button>
  ) : (
 <p className="rounded-zed glass-panel px-6 py-4 text-center text-sm font-bold text-[#334155]">
 Currently out of stock
 </p>
 )}
  {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
  {whatsappNumber && productName ? (
      <button
        type="button"
        onClick={orderOnWhatsApp}
        data-track="whatsapp_click"
        data-track-value={productName}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-zed bg-[#25D366] px-5 py-3 text-[13px] font-bold text-white transition-transform hover:scale-[1.01] disabled:opacity-60"
      >
        Order on WhatsApp
      </button>
  ) : null}
  <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-[#334155]">
  <ShieldCheck className="size-4 text-soft-sage" /> Secure M-PESA checkout · Free gift box included
  </p>
 </div>


  {/* Mobile sticky purchase bar */}
  <div className="fixed inset-x-0 bottom-0 z-[60] flex items-center gap-3 border-t border-black/10 bg-white/95 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-6px_24px_rgba(0,0,0,0.10)] backdrop-blur md:hidden">
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-medium text-[#64748b]">Total price</p>
      <p className="truncate text-lg font-extrabold leading-tight text-[var(--color-ink)]">{formatKES(price * quantity)}</p>
    </div>
    {inStock ? (
      <button type="button" onClick={addToCart} disabled={busy} className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#9dbb35] px-3 text-xs font-bold text-[#17210b] shadow-sm disabled:opacity-60">
        <ShoppingBag className="size-4 shrink-0" /> {busy ? "Adding…" : "Add to cart"}
      </button>
    ) : <span className="min-w-0 flex-1 rounded-full bg-black/5 px-2 py-3 text-center text-[11px] font-semibold text-[#64748b]">Out of stock</span>}
    {whatsappNumber && productName ? (
      <button type="button" onClick={orderOnWhatsApp} className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#25D366] px-3 text-xs font-bold text-white shadow-sm">
        <MessageCircle className="size-4 shrink-0" /> WhatsApp
      </button>
    ) : null}
  </div>
 </div>
 );
}