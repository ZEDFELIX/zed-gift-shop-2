import "server-only";

import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatKES } from "@/lib/utils";
import { ArrowLeft, Check, FileImage, Loader2, X } from "lucide-react";

export const metadata = { title: "Design Approvals" };

export default async function DesignApprovalsPage() {
 const user = (await getCurrentUser())!;

 const orders = await prisma.order.findMany({
 where: {
 userId: user.id,
 items: {
 some: {
 personalizationJson: { not: null },
 },
 },
 },
 include: { items: true, payments: true },
 orderBy: { createdAt: "desc" },
 });

 const pendingDesigns = orders.filter(
 (o) =>
 o.orderStatus === "CUSTOMIZATION" ||
 o.orderStatus === "PROCESSING"
 );

 return (
 <div className="container-zed py-10 lg:py-14">
 <div className="flex flex-wrap items-end justify-between gap-4">
 <div>
 <p className="eyebrow">Design workflow</p>
 <h1 className="mt-2 font-display text-3xl font-bold text-[#171717]">Design Approvals</h1>
 <p className="mt-1 text-sm text-[#6B6B6B]">
 Review and approve custom designs before we begin production.
 </p>
 </div>
 <Link href="/account" className="flex items-center gap-1 text-sm font-semibold text-deep-olive hover:underline">
 <ArrowLeft className="size-4" /> Back to account
 </Link>
 </div>

 {pendingDesigns.length === 0 ? (
 <div className="glass-panel mx-auto mt-14 max-w-md rounded-zed p-10 text-center">
 <FileImage className="mx-auto size-12 text-soft-sage/50" />
 <p className="mt-4 font-display text-xl font-bold text-[#171717]">No designs pending</p>
 <p className="mt-2 text-sm text-[#6B6B6B]">
 Custom design approvals appear here when you order personalized items.
 </p>
 </div>
 ) : (
 <div className="mt-8 space-y-6">
 {pendingDesigns.map((order) => (
 <article key={order.id} className="glass-card rounded-zed p-6">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div>
 <p className="font-display text-sm font-bold text-[#171717]">{order.orderNumber}</p>
 <p className="text-xs text-[#6B6B6B]">
 {order.createdAt.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })} | {order.items.length} item(s)
 </p>
 </div>
 <span className="rounded-full bg-warm-white px-2.5 py-1 text-xs font-semibold text-[#171717]">
 Pending Your Approval
 </span>
 </div>

 <div className="mt-6 grid gap-4 sm:grid-cols-2">
 {order.items.map((item) => (
 <div key={item.id} className="rounded-zed border border-edge bg-white/40 p-4">
 <div className="flex items-center gap-3">
 {item.image ? (
 <div className="relative h-16 w-16 overflow-hidden rounded-zed">
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
 </div>
 ) : (
 <div className="grid h-16 w-16 place-items-center rounded-zed bg-zed-950 text-xs font-bold text-white">
 ZED
 </div>
 )}
 <div>
 <p className="text-sm font-semibold text-[#171717]">{item.name}</p>
 {item.personalizationJson && (
 <p className="text-xs text-soft-sage">
 {(() => { try { const p = JSON.parse(item.personalizationJson); return p.engravingText ?? p.name ?? "Custom"; } catch { return "Custom"; } })()}
 </p>
 )}
 <p className="mt-1 text-sm font-bold text-[#171717]">{formatKES(item.price)}</p>
 </div>
 </div>
 </div>
 ))}
 </div>

 <div className="mt-6 flex flex-wrap gap-3">
 <button
 type="button"
 className="inline-flex items-center gap-2 rounded-zed bg-zed-950 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-zed-900"
 >
 <Check className="size-4" /> Approve Design
 </button>
 <button
 type="button"
 className="inline-flex items-center gap-2 rounded-zed border border-red-300 bg-white px-6 py-3 text-sm font-bold text-red-700 transition-colors hover:bg-red-50"
 >
 <X className="size-4" /> Request Changes
 </button>
 </div>
 </article>
 ))}
 </div>
 )}
 </div>
 );
}
