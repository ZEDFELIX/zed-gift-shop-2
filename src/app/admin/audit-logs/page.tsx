import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listAuditLogs } from "@/lib/data/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit logs | Admin" };

const PAGE_SIZE = 30;

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; action?: string; entity?: string; page?: string }>;
}) {
  const me = await getCurrentUser();
  if (me?.role !== "ADMIN") {
    return (
      <div className="rounded-zed border border-edge bg-white p-6">
        <h2 className="font-display text-xl font-bold text-[#07111F]">Restricted</h2>
        <p className="mt-1 text-sm text-[#334155]">
          Only the store owner can view the audit trail. Staff activity on orders, products and customers is recorded
          here for the owner to review.
        </p>
        <Link href="/admin" className="mt-4 inline-block text-sm font-semibold text-soft-sage hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = sp.q?.trim() || undefined;
  const action = sp.action?.trim() || undefined;
  const entity = sp.entity?.trim() || undefined;

  const { items, total } = await listAuditLogs({ q, action, entity, page, pageSize: PAGE_SIZE });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (over: Record<string, string>) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (action) p.set("action", action);
    if (entity) p.set("entity", entity);
    for (const [k, v] of Object.entries(over)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    p.set("page", String(over.page ?? page));
    return `/admin/audit-logs?${p.toString()}`;
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold text-[#07111F]">Audit logs</h2>
        <p className="mt-1 text-sm text-[#334155]">
          {total} recorded action{total === 1 ? "" : "s"} — who did what, and when.
        </p>
      </div>

      <form method="GET" className="grid gap-2 rounded-zed border border-edge bg-white p-4 sm:grid-cols-4">
        <input name="q" defaultValue={q ?? ""} placeholder="Search email, action, id…" className="field" aria-label="Search audit logs" />
        <input name="action" defaultValue={action ?? ""} placeholder="Action e.g. order." className="field" aria-label="Filter by action" />
        <input name="entity" defaultValue={entity ?? ""} placeholder="Entity e.g. Order" className="field" aria-label="Filter by entity" />
        <button type="submit" className="rounded-zed bg-zed-950 px-4 py-2.5 text-sm font-bold text-white">
          Apply
        </button>
      </form>

      <div className="overflow-x-auto rounded-zed border border-edge bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-edge text-xs uppercase tracking-wider text-[#334155]">
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">IP</th>
            </tr>
          </thead>
          <tbody>
            {items.map((l) => (
              <tr key={l.id} className="border-b border-edge/60 last:border-0">
                <td className="whitespace-nowrap px-4 py-2.5 text-[#334155]">
                  {new Date(l.createdAt).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-4 py-2.5">
                  <p className="font-semibold text-[#07111F]">{l.actorEmail ?? "System"}</p>
                  {l.actorRole && <p className="text-xs text-[#334155]">{l.actorRole}</p>}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-[#07111F]">{l.action}</td>
                <td className="px-4 py-2.5 text-[#334155]">
                  {l.entity}
                  {l.entityId && <span className="ml-1 font-mono text-xs">#{l.entityId.slice(-6)}</span>}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-xs text-[#334155]">{l.ipAddress ?? "—"}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-[#334155]">
                  No audit entries match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-[#334155]">
            Page {page} of {pages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={qs({ page: String(page - 1) })} className="rounded-zed border border-edge bg-white px-4 py-2 font-semibold text-[#07111F]">
                Previous
              </Link>
            )}
            {page < pages && (
              <Link href={qs({ page: String(page + 1) })} className="rounded-zed border border-edge bg-white px-4 py-2 font-semibold text-[#07111F]">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
