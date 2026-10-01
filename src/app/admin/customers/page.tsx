import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { listCustomersAdmin } from "@/lib/data/admin";
import { formatKES, formatDate, maskPhone } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Customers | Admin" };

const STATUSES = ["ALL", "ACTIVE", "SUSPENDED", "DISABLED"];

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = sp.status ?? "ALL";
  const page = Number(sp.page ?? 1) || 1;
  const { items, total } = await listCustomersAdmin({ q, status, page, pageSize: 25 });
  const pages = Math.max(1, Math.ceil(total / 25));

  return (
    <div className="space-y-4">
      <form method="GET" className="flex flex-wrap items-center gap-2">
        <input name="q" defaultValue={q} placeholder="Name, email or phone..." className="field w-72" />
        <select name="status" defaultValue={status} className="field w-40">
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "ALL" ? "All statuses" : s}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-zed border border-edge bg-white px-4 py-2.5 text-sm font-semibold text-[#07111F] hover:border-soft-sage">
          Filter
        </button>
      </form>

      <p className="text-sm text-[#334155]">{total} customer{total === 1 ? "" : "s"}</p>

      <div className="overflow-x-auto rounded-zed border border-edge bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-edge bg-panel text-left text-xs uppercase tracking-wider text-[#334155]">
              <th className="p-3">Customer</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Orders</th>
              <th className="p-3">Spent</th>
              <th className="p-3">Status</th>
              <th className="p-3">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {items.map((c) => (
              <tr key={c.id} className="hover:bg-panel/50">
                <td className="p-3">
                  <Link href={`/admin/customers/${c.id}`} className="font-semibold text-soft-sage hover:underline">
                    {c.name}
                  </Link>
                  <p className="text-xs text-[#334155]">{c.email}</p>
                </td>
                <td className="p-3 text-[#334155]">{c.phone ? maskPhone(c.phone) : "-"}</td>
                <td className="p-3 font-semibold text-[#07111F]">{c.totalOrders}</td>
                <td className="p-3 font-semibold text-[#07111F]">{formatKES(c.totalSpent)}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${statusTint(c.status)}`}>{c.status}</span>
                </td>
                <td className="p-3 text-xs text-[#334155]">{formatDate(c.createdAt)}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[#334155]">
                  No customers match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={`?page=${n}${q ? `&q=${encodeURIComponent(q)}` : ""}&status=${status}`}
              className={`rounded-zed px-3 py-1.5 font-semibold ${n === page ? "bg-zed-950 text-white" : "bg-panel text-[#334155]"}`}
            >
              {n}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function statusTint(status: string) {
  if (status === "ACTIVE") return "bg-emerald-50 text-emerald-700";
  if (status === "SUSPENDED") return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-600";
}
