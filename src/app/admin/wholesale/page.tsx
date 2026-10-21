import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { WholesaleQuotesManager, type WholesaleQuoteRow } from "@/components/admin/WholesaleQuotesManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Wholesale quotes | Admin" };

export default async function AdminWholesalePage() {
  const me = await getCurrentUser();
  if (me?.role !== "ADMIN") {
    return (
      <div className="rounded-zed border border-edge bg-white p-6">
        <h2 className="font-display text-xl font-bold text-[#07111F]">Restricted</h2>
        <p className="mt-1 text-sm text-[#334155]">Only the store owner can review wholesale quotation requests.</p>
      </div>
    );
  }

  const quotes = await prisma.wholesaleQuote.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const rows: WholesaleQuoteRow[] = quotes.map((q) => {
    let items: { name: string; quantity: number }[] = [];
    try {
      const parsed: unknown = JSON.parse(q.itemsJson);
      if (Array.isArray(parsed)) {
        items = parsed
          .filter((i): i is Record<string, unknown> => Boolean(i) && typeof i === "object")
          .map((i) => ({ name: String(i.name ?? ""), quantity: Math.max(1, Math.round(Number(i.quantity) || 1)) }))
          .filter((i) => i.name);
      }
    } catch {
      items = [];
    }
    return {
      id: q.id,
      name: q.name,
      phone: q.phone,
      email: q.email ?? "",
      organisation: q.organisation ?? "",
      location: q.location,
      budget: q.budget ?? null,
      details: q.details ?? "",
      items,
      status: q.status,
      createdAt: q.createdAt.toISOString(),
    };
  });

  const newCount = rows.filter((r) => r.status === "NEW").length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#334155]">{newCount} new | {rows.length} total</p>
      <WholesaleQuotesManager quotes={rows} />
    </div>
  );
}
