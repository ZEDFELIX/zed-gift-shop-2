import Link from "next/link";
import Image from "next/image";
import { adminListProducts } from "@/lib/data/products";
import { formatKES } from "@/lib/utils";
import { Plus, Search } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Products | Admin" };

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
 const sp = await searchParams;
 const q = sp.q?.trim() ?? "";
 const status = sp.status ?? "";
 const page = Number(sp.page ?? 1) || 1;
 const { items, total, pages, page: current } = await adminListProducts({ q, status, page });

 return (
 <div className="space-y-4">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <form method="GET" className="flex flex-wrap gap-2">
 <input name="q" defaultValue={q} placeholder="Search name, SKU or slug..." className="field w-64" />
 <select name="status" defaultValue={status} className="field w-40">
 <option value="">All statuses</option>
 <option value="ACTIVE">Active</option>
 <option value="DRAFT">Draft</option>
 <option value="ARCHIVED">Archived</option>
 </select>
 <button type="submit" className="rounded-zed border border-edge bg-white px-4 text-sm font-semibold text-[#171717] hover:border-soft-sage">
 <Search className="size-4" />
 </button>
 </form>
 <Link href="/admin/products/new" className="flex items-center gap-1.5 rounded-zed bg-zed-950 px-4 py-2.5 text-sm font-bold text-white">
 <Plus className="size-4" /> New product
 </Link>
 </div>

 <p className="text-sm text-[#6B6B6B]">{total} product{total === 1 ? "" : "s"}</p>

 <div className="overflow-x-auto rounded-zed border border-edge bg-white">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-edge bg-panel text-left text-xs uppercase tracking-wider text-[#6B6B6B]">
 <th className="p-3">Product</th>
 <th className="p-3">SKU</th>
 <th className="p-3">Price</th>
 <th className="p-3">Stock</th>
 <th className="p-3">Status</th>
 <th className="p-3" />
 </tr>
 </thead>
 <tbody className="divide-y divide-edge">
 {items.map((p) => (
 <tr key={p.id} className="hover:bg-panel/50">
 <td className="p-3">
 <div className="flex items-center gap-3">
 <span className="relative block size-10 shrink-0 overflow-hidden rounded-zed glass-panel">
 {p.images[0]?.url && <Image src={p.images[0].url} alt="" fill unoptimized className="object-cover" />}
 </span>
 <div>
 <p className="font-semibold text-[#171717]">{p.name}</p>
 <p className="text-xs text-[#6B6B6B]">/{p.slug}</p>
 </div>
 </div>
 </td>
 <td className="p-3 text-[#6B6B6B]">{p.sku ?? "-"}</td>
 <td className="p-3 font-semibold text-[#171717]">{formatKES(p.price)}</td>
 <td className={`p-3 font-semibold ${p.quantity <= p.lowStockThreshold ? "text-red-600" : "text-[#171717]"}`}>{p.quantity}</td>
 <td className="p-3">
 <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${p.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : p.status === "DRAFT" ? "bg-amber-50 text-amber-700" : "bg-panel text-[#6B6B6B]"}`}>
 {p.status}
 </span>
 </td>
 <td className="p-3 text-right">
 <Link href={`/admin/products/${p.id}`} className="font-semibold text-soft-sage hover:underline">Edit</Link>
 </td>
 </tr>
 ))}
 {items.length === 0 && (
 <tr><td colSpan={6} className="p-8 text-center text-[#6B6B6B]">No products match that search.</td></tr>
 )}
 </tbody>
 </table>
 </div>

 {pages > 1 && (
 <div className="flex items-center justify-center gap-2 text-sm">
 {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
 <Link key={n} href={`?page=${n}${q ? `&q=${encodeURIComponent(q)}` : ""}${status ? `&status=${status}` : ""}`}
 className={`rounded-zed px-3 py-1.5 font-semibold ${n === current ? "bg-zed-950 text-white" : "bg-panel text-[#6B6B6B] hover:bg-panel/70"}`}>
 {n}
 </Link>
 ))}
 </div>
 )}
 </div>
 );
}