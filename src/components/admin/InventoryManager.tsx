"use client";

import { Fragment, useMemo, useState } from "react";
import Image from "next/image";
import { Loader2, Minus, Plus } from "lucide-react";

type Variant = { id: string; value: string; sku: string; quantity: number; reservedQuantity: number };
type ProductRow = {
 id: string;
 name: string;
 imageUrl: string | null;
 quantity: number;
 reservedQuantity: number;
 lowStockThreshold: number;
 variantCount: number;
 variants: Variant[];
};

export function InventoryManager({ products }: { products: ProductRow[] }) {
 const [q, setQ] = useState("");
 const [busyId, setBusyId] = useState<string | null>(null);
 const filtered = useMemo(() => (q ? products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())) : products), [q, products]);

 async function adjust(productId: string, variantId: string | null, delta: number) {
 setBusyId(`${productId}:${variantId ?? ""}:${delta}`);
 try {
 await fetch("/api/admin/inventory", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ productId, variantId: variantId ?? "", delta, note: "Manual admin adjustment" }),
 });
 await new Promise((r) => setTimeout(r, 600));
 window.location.reload();
 } finally {
 setBusyId(null);
 }
 }

 return (
 <div className="space-y-4">
 <input className="field w-full max-w-sm" placeholder="Search products..." value={q} onChange={(e) => setQ(e.target.value)} />
 <div className="overflow-hidden rounded-zed border border-edge bg-white">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-edge bg-panel text-left text-xs uppercase tracking-wider text-[#334155]">
 <th className="p-3">Product</th>
 <th className="p-3">On hand</th>
 <th className="p-3">Reserved</th>
 <th className="p-3">Available</th>
 <th className="p-3">Adjust</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-edge">
 {filtered.map((p) => {
 const sticky = p.quantity <= p.lowStockThreshold;
 return (
 <Fragment key={p.id}>
 <tr className={sticky ? "bg-red-50/40" : "hover:bg-panel/40"}>
 <td className="p-3">
 <div className="flex items-center gap-3">
 <span className="relative block size-9 shrink-0 overflow-hidden rounded-zed glass-panel">
 {p.imageUrl && <Image src={p.imageUrl} alt="" fill unoptimized className="object-cover" />}
 </span>
 <div>
 <p className="font-semibold text-[#07111F]">{p.name}</p>
 {sticky && <p className="text-[11px] font-bold text-red-600">LOW STOCK</p>}
 </div>
 </div>
 </td>
 <td className="p-3 font-bold text-[#07111F]">{p.quantity}</td>
 <td className="p-3 text-[#334155]">{p.reservedQuantity}</td>
 <td className="p-3 font-semibold text-[#07111F]">{Math.max(0, p.quantity - p.reservedQuantity)}</td>
 <td className="p-3">
 <div className="flex items-center gap-1.5">
 <button type="button" disabled={busyId === `${p.id}::-1`} onClick={() => adjust(p.id, null, -1)} className="rounded-zed border border-edge p-1.5 hover:border-soft-sage disabled:opacity-40" aria-label="Decrease">
 <Minus className="size-3.5" />
 </button>
 <button type="button" disabled={busyId === `${p.id}::1`} onClick={() => adjust(p.id, null, 1)} className="rounded-zed border border-edge p-1.5 hover:border-soft-sage disabled:opacity-40" aria-label="Increase">
 <Plus className="size-3.5" />
 </button>
 </div>
 </td>
 </tr>
 {p.variants.map((v) => (
 <tr key={v.id} className="bg-panel/30 text-xs hover:bg-panel/60">
 <td className="p-2 pl-9 text-[#334155]">{p.name} | {v.value} <span className="text-[#334155]">({v.sku})</span></td>
 <td className="p-2 font-semibold text-[#07111F]">{v.quantity}</td>
 <td className="p-2 text-[#334155]">{v.reservedQuantity}</td>
 <td className="p-2 text-[#334155]">{Math.max(0, v.quantity - v.reservedQuantity)}</td>
 <td className="p-2">
 <div className="flex items-center gap-1.5">
 <button type="button" disabled={busyId === `${v.id}::-1`} onClick={() => adjust(p.id, v.id, -1)} className="rounded-zed border border-edge bg-white p-1.5 hover:border-soft-sage disabled:opacity-40" aria-label="Decrease variant">
 <Minus className="size-3" />
 </button>
 <button type="button" disabled={busyId === `${v.id}::1`} onClick={() => adjust(p.id, v.id, 1)} className="rounded-zed border border-edge bg-white p-1.5 hover:border-soft-sage disabled:opacity-40" aria-label="Increase variant">
 <Plus className="size-3" />
 </button>
 {busyId === `${v.id}::1` || busyId === `${v.id}::-1` ? <Loader2 className="size-3 animate-spin text-[#334155]" /> : null}
 </div>
 </td>
 </tr>
 ))}
 </Fragment>
 );
 })}
 {filtered.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-[#334155]">No products.</td></tr>}
 </tbody>
 </table>
 </div>
 </div>
 );
}