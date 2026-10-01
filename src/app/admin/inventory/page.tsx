import { prisma } from "@/lib/prisma";
import { listTransactions } from "@/lib/data/inventory";
import { InventoryManager } from "@/components/admin/InventoryManager";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inventory | Admin" };

export default async function AdminInventoryPage() {
 const [products, txns] = await Promise.all([
 prisma.product.findMany({
 where: { status: "ACTIVE" },
 include: { variants: { where: { active: true } }, images: { take: 1 } },
 orderBy: [{ quantity: "asc" }],
 take: 200,
 }),
 listTransactions({ take: 15 }),
 ]);

 return (
 <div className="space-y-6">
 <InventoryManager products={products.map((p) => ({
 id: p.id,
 name: p.name,
 imageUrl: p.images[0]?.url ?? null,
 quantity: p.quantity,
 reservedQuantity: p.reservedQuantity,
 lowStockThreshold: p.lowStockThreshold,
 variantCount: p.variants.length,
 variants: p.variants.map((v) => ({ id: v.id, value: v.value, sku: v.sku, quantity: v.quantity, reservedQuantity: v.reservedQuantity })),
 }))} />

 <section className="rounded-zed border border-edge bg-white p-5">
 <h2 className="font-display text-base font-bold text-[#07111F]">Recent movements</h2>
 <ul className="mt-3 divide-y divide-edge text-sm">
 {txns.map((t) => (
 <li key={t.id} className="flex items-center justify-between gap-2 py-2">
 <div className="min-w-0">
 <p className="truncate font-medium text-[#07111F]">{t.product?.name ?? "Deleted product"} {t.variant ? `| ${t.variant.value}` : ""}</p>
 <p className="truncate text-xs text-[#334155]">{t.type} - {t.note ?? ""}</p>
 </div>
 <div className="shrink-0 text-right">
 <p className={`font-bold ${t.quantity > 0 ? "text-emerald-600" : "text-red-600"}`}>{t.quantity > 0 ? "+" : ""}{t.quantity}</p>
 <p className="text-xs text-[#334155]">{formatDate(t.createdAt)}</p>
 </div>
 </li>
 ))}
 {txns.length === 0 && <li className="py-4 text-center text-[#334155]">No transactions yet.</li>}
 </ul>
 </section>
 </div>
 );
}