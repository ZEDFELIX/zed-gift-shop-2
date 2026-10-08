"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

type CategoryOption = { id: string; name: string; kind: string };
type CollectionOption = { id: string; name: string };

type VariantRow = { name: string; value: string; sku: string; priceOffset: number; quantity: number; active: boolean };

type ProductInitial = {
 id?: string;
 name: string;
 slug: string;
 headline: string;
 shortDescription: string;
 description: string;
 price: number;
 compareAtPrice: number | null;
 sku: string;
 status: string;
 featured: boolean;
 bestSeller: boolean;
 trackInventory: boolean;
 quantity: number;
 lowStockThreshold: number;
 personalizationEnabled: boolean;
 giftWrapAvailable: boolean;
 giftMessageAvailable: boolean;
 images: string[];
 videoUrl: string;
 categoryIds: string[];
 collectionIds: string[];
 variants: VariantRow[];
};

const emptyProduct: ProductInitial = {
 name: "", slug: "", headline: "", shortDescription: "", description: "",
 price: 0, compareAtPrice: null, sku: "", status: "DRAFT", featured: false, bestSeller: false,
 trackInventory: true, quantity: 0, lowStockThreshold: 5,
 personalizationEnabled: false, giftWrapAvailable: false, giftMessageAvailable: true,
 images: [], videoUrl: "", categoryIds: [], collectionIds: [], variants: [],
};

export function ProductForm({ product, categories, collections }: { product?: ProductInitial; categories: CategoryOption[]; collections: CollectionOption[] }) {
 const router = useRouter();
 const [form, setForm] = useState<ProductInitial>(product ?? emptyProduct);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const isEdit = Boolean(product?.id);

 function set<K extends keyof ProductInitial>(key: K, value: ProductInitial[K]) {
 setForm((f) => ({ ...f, [key]: value }));
 }

 function toggleInArray(key: "categoryIds" | "collectionIds", id: string) {
 setForm((f) => ({
 ...f,
 [key]: f[key].includes(id) ? f[key].filter((x) => x !== id) : [...f[key], id],
 }));
 }

 function addVariant() {
 setForm((f) => ({ ...f, variants: [...f.variants, { name: "", value: "", sku: "", priceOffset: 0, quantity: 0, active: true }] }));
 }

 function updateVariant(i: number, patch: Partial<VariantRow>) {
 setForm((f) => ({ ...f, variants: f.variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v)) }));
 }

 async function submit(e: React.FormEvent) {
 e.preventDefault();
 setBusy(true);
 setError(null);
 const payload = {
 ...form,
 compareAtPrice: form.compareAtPrice === null || form.compareAtPrice === 0 ? null : Number(form.compareAtPrice),
 price: Number(form.price),
 images: form.images,
 videoUrl: form.videoUrl.trim(),
 };
 try {
 const res = await fetch(isEdit ? `/api/admin/products/${product!.id}` : "/api/admin/products", {
 method: isEdit ? "PATCH" : "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(payload),
 });
 const data = (await res.json()) as { error?: string };
 if (!res.ok) {
 setError(data.error ?? "Couldn't save the product.");
 setBusy(false);
 return;
 }
 router.push("/admin/products");
 router.refresh();
 } catch {
 setError("Network error - please try again.");
 setBusy(false);
 }
 }

 const imageText = form.images.join("\n");

 return (
 <form onSubmit={submit} className="space-y-5">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <Link href="/admin/products" className="flex items-center gap-1 text-sm font-semibold text-[#334155] hover:text-soft-sage">
 <ArrowLeft className="size-4" /> All products
 </Link>
 <button type="submit" disabled={busy} className="flex items-center gap-2 rounded-zed bg-zed-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
 {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} {isEdit ? "Save changes" : "Create product"}
 </button>
 </div>

 {error && <p className="rounded-zed bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

 <div className="grid gap-4 rounded-zed border border-edge bg-white p-5 lg:grid-cols-2">
 <div className="lg:col-span-2">
 <label className="label" htmlFor="pf-name">Product name</label>
 <input id="pf-name" className="field" value={form.name} onChange={(e) => set("name", e.target.value)} required />
 </div>
 <div>
 <label className="label" htmlFor="pf-slug">Slug (a-z, 0-9, -)</label>
 <input id="pf-slug" className="field" value={form.slug} onChange={(e) => set("slug", e.target.value.toLowerCase())} required pattern="^[a-z0-9-]+$" />
 </div>
 <div>
 <label className="label" htmlFor="pf-sku">SKU</label>
 <input id="pf-sku" className="field" value={form.sku} onChange={(e) => set("sku", e.target.value)} />
 </div>
 <div className="lg:col-span-2">
 <label className="label" htmlFor="pf-headline">Short headline</label>
 <input id="pf-headline" className="field" value={form.headline} onChange={(e) => set("headline", e.target.value)} maxLength={240} />
 </div>
 <div className="lg:col-span-2">
 <label className="label" htmlFor="pf-short">Short description</label>
 <input id="pf-short" className="field" value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} maxLength={400} />
 </div>
 <div className="lg:col-span-2">
 <label className="label" htmlFor="pf-desc">Description</label>
 <textarea id="pf-desc" className="field min-h-32 py-3" value={form.description} onChange={(e) => set("description", e.target.value)} />
 </div>
 <div>
 <label className="label" htmlFor="pf-price">Price (KES)</label>
 <input id="pf-price" type="number" min={0} className="field" value={form.price} onChange={(e) => set("price", Number(e.target.value))} required />
 </div>
 <div>
 <label className="label" htmlFor="pf-compare">Compare at (KES)</label>
 <input id="pf-compare" type="number" min={0} className="field" value={form.compareAtPrice ?? ""} onChange={(e) => set("compareAtPrice", e.target.value ? Number(e.target.value) : null)} />
 </div>
 <div>
 <label className="label" htmlFor="pf-status">Status</label>
 <select id="pf-status" className="field" value={form.status} onChange={(e) => set("status", e.target.value)}>
 <option value="DRAFT">Draft</option>
 <option value="ACTIVE">Active</option>
 <option value="ARCHIVED">Archived</option>
 </select>
 </div>
 <div>
 <label className="label" htmlFor="pf-qty">Quantity</label>
 <input id="pf-qty" type="number" min={0} className="field" value={form.quantity} onChange={(e) => set("quantity", Number(e.target.value))} />
 </div>
 <div>
 <label className="label" htmlFor="pf-threshold">Low stock threshold</label>
 <input id="pf-threshold" type="number" min={0} className="field" value={form.lowStockThreshold} onChange={(e) => set("lowStockThreshold", Number(e.target.value))} />
 </div>
 <div className="lg:col-span-2 rounded-zed border border-edge bg-white/60 p-4">
 <div className="flex items-center justify-between gap-3">
 <div>
 <p className="label">Product media</p>
 <p className="mt-1 text-xs text-[#334155]">Add up to 3 product pictures and 1 product video. The first picture is the main product image.</p>
 </div>
 <span className="rounded-full bg-zed-900/10 px-3 py-1 text-[11px] font-bold text-zed-700">{form.images.length}/3 images</span>
 </div>
 <div className="mt-3 grid gap-3 sm:grid-cols-3">
 {[0,1,2].map((i) => (
 <div key={i}>
 <label className="label" htmlFor={`pf-image-${i}`}>Picture {i + 1}{i === 0 ? " (main)" : ""}</label>
 <input id={`pf-image-${i}`} className="field" type="url" placeholder="https://..." value={form.images[i] ?? ""} onChange={(e) => {
   const next = [...form.images];
   if (e.target.value.trim()) next[i] = e.target.value.trim();
   else next.splice(i, 1);
   set("images", next.slice(0, 3));
 }} />
 </div>
 ))}
 </div>
 <div className="mt-3">
 <label className="label" htmlFor="pf-video">Product video (optional)</label>
 <input id="pf-video" className="field" type="url" placeholder="https://.../product-video.mp4" value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value.trim())} />
 <p className="mt-1 text-[11px] text-[#334155]">Use a direct video file URL such as MP4/WebM. The video will appear on the product page.</p>
 </div>
 </div>
 <div className="lg:col-span-2 flex flex-wrap gap-4">
 {([
 ["featured", "Featured"],
 ["bestSeller", "Best seller"],
 ["trackInventory", "Track inventory"],
 ["personalizationEnabled", "Personalizable"],
 ["giftWrapAvailable", "Gift wrap available"],
 ["giftMessageAvailable", "Gift message available"],
 ] as const).map(([key, label]) => (
 <label key={key} className="flex items-center gap-2 text-sm text-[#07111F]">
 <input type="checkbox" checked={form[key] as boolean} onChange={(e) => set(key, e.target.checked as never)} className="size-4 accent-deep-olive" />
 {label}
 </label>
 ))}
 </div>
 </div>

 <div className="grid gap-4 rounded-zed border border-edge bg-white p-5 lg:grid-cols-2">
 <div>
 <p className="label">Categories</p>
 <div className="mt-1 max-h-56 space-y-1.5 overflow-y-auto rounded-zed border border-edge p-3">
 {categories.map((c) => (
 <label key={c.id} className="flex items-center gap-2 text-sm text-[#07111F]">
 <input type="checkbox" checked={form.categoryIds.includes(c.id)} onChange={() => toggleInArray("categoryIds", c.id)} className="size-4 accent-deep-olive" />
 {c.name} <span className="text-[10px] uppercase text-[#334155]">{c.kind}</span>
 </label>
 ))}
 </div>
 </div>
 <div>
 <p className="label">Collections</p>
 <div className="mt-1 max-h-56 space-y-1.5 overflow-y-auto rounded-zed border border-edge p-3">
 {collections.map((c) => (
 <label key={c.id} className="flex items-center gap-2 text-sm text-[#07111F]">
 <input type="checkbox" checked={form.collectionIds.includes(c.id)} onChange={() => toggleInArray("collectionIds", c.id)} className="size-4 accent-deep-olive" />
 {c.name}
 </label>
 ))}
 </div>
 </div>
 </div>

 <div className="rounded-zed border border-edge bg-white p-5">
 <div className="flex items-center justify-between">
 <p className="label">Variants (size, scent, colour...)</p>
 <button type="button" onClick={addVariant} className="flex items-center gap-1.5 rounded-zed border border-edge px-3 py-1.5 text-xs font-semibold text-[#07111F] hover:border-soft-sage">
 <Plus className="size-3.5" /> Add variant
 </button>
 </div>
 {form.variants.length === 0 ? (
 <p className="mt-3 text-sm text-[#334155]">No variants - the product is sold as a single SKU.</p>
 ) : (
 <ul className="mt-3 space-y-3">
 {form.variants.map((v, i) => (
 <li key={i} className="grid gap-3 rounded-zed glass-panel p-3 sm:grid-cols-6">
 <input className="field" placeholder="Name (e.g. Size)" value={v.name} onChange={(e) => updateVariant(i, { name: e.target.value })} required />
 <input className="field" placeholder="Value" value={v.value} onChange={(e) => updateVariant(i, { value: e.target.value })} required />
 <input className="field" placeholder="SKU" value={v.sku} onChange={(e) => updateVariant(i, { sku: e.target.value })} required />
 <input type="number" className="field" placeholder="Price +" value={v.priceOffset} onChange={(e) => updateVariant(i, { priceOffset: Number(e.target.value) })} />
 <input type="number" className="field" placeholder="Qty" value={v.quantity} onChange={(e) => updateVariant(i, { quantity: Number(e.target.value) })} />
 <button type="button" onClick={() => set("variants", form.variants.filter((_, idx) => idx !== i))} className="justify-self-center rounded-zed border border-red-100 p-2 text-red-500 hover:bg-red-50" aria-label="Remove variant">
 <Trash2 className="size-4" />
 </button>
 </li>
 ))}
 </ul>
 )}
 </div>
 </form>
 );
}