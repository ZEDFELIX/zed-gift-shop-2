import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminTopBar } from "@/components/admin/AdminTopBar";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!["ADMIN", "STAFF"].includes(user.role)) redirect("/account");

  const isAdmin = user.role === "ADMIN";

  return (
    <div className="zed-admin min-h-screen bg-[#f5f6f8] text-slate-900">
      <AdminTopBar role={user.role} email={user.email} name={user.name} />
      <div className="container-zed py-5 sm:py-7">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Zed Gift Shop / Workspace</p>
            <h1 className="mt-1 font-display text-[25px] font-bold tracking-tight text-slate-950 sm:text-[28px]">Store management</h1>
            <p className="mt-1 text-sm text-slate-500">Manage orders, products and your customer experience.</p>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-500">{isAdmin ? "Owner access" : "Staff access"}</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-[236px_minmax(0,1fr)] lg:items-start lg:gap-6">
          <AdminNav isAdmin={isAdmin} />
          <main className="zed-admin-content min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
