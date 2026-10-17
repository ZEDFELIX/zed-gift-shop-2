"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Gift, Plus } from "lucide-react";
import { formatKES } from "@/lib/utils";

type UpsellProduct = {
 id: string;
 slug: string;
 name: string;
 price: number;
 compareAtPrice: number | null;
 tags: string[];
 images: { url: string }[];
};

export function CompleteTheGiftUpsell() {
 const [products, setProducts] = useState<UpsellProduct[]>([]);
 const [busyId, setBusyId] = useState<string | null>(null);
 const [added, setAdded] = useState<string | null>(null);

 useEffect(() => {
 let cancelled = false;
 fetch("/api/cart/upsell", { cache: "no-store" })
 .then((r) => (r.ok ? r.json() : { products: [] }))
 .then((data) => {
 if (!cancelled) setProducts((data.products ?? []) as UpsellProduct[]);
 })
 .catch(() => undefined);
 return () => {
 cancelled = true;
 };
 }, []);

 async function add(product: UpsellProduct) {
 setBusyId(product.id);
 try {
 const res = await fetch("/api/cart/items", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ productId: product.id, quantity: 1 }),
 });
 const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
 if (res.ok && data.ok) {
 setAdded(product.id);
 window.dispatchEvent(new CustomEvent("zed:open-cart"));
 }
 } finally {
 setBusyId(null);
 }
 }

 if (products.length === 0) return null;

 return (
 <div className="mb-3">
 <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-charcoal/60">
 <Gift className="size-3.5" /> Complete your gift
 </p>
 <div className="grid grid-cols-3 gap-2">
 {products.map((p) => (
 <div key={p.id} className="glass-card rounded-xl border border-white/70 bg-white/45 p-2">
 <Link href={`/product/${p.slug}`} className="relative block aspect-square overflow-hidden rounded-lg bg-white/45">
 {p.images[0]?.url ? (
 <Image src={p.images[0].url} alt={p.name} fill sizes="120px" unoptimized className="object-cover" />
 ) : (
 <span className="grid size-full place-items-center text-rose-400">
 <Gift className="size-5" />
 </span>
 )}
 </Link>
 <p className="mt-1.5 line-clamp-2 text-[11px] font-semibold leading-tight text-charcoal">{p.name}</p>
 <div className="mt-1 flex items-center justify-between gap-1">
 <span className="text-[11px] font-bold text-charcoal">{formatKES(p.price)}</span>
 <button
 type="button"
 onClick={() => add(p)}
 disabled={busyId === p.id}
 aria-label={`Add ${p.name} to cart`}
 className="grid size-7 shrink-0 place-items-center rounded-full bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-60"
 >
 {added === p.id ? <span className="text-[10px] font-bold">Added</span> : <Plus className="size-3.5" />}
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>
 );
}
