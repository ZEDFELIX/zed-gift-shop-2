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
    <div className="min-h-screen bg-panel/40">
      <AdminTopBar role={user.role} email={user.email} />
      <div className="container-zed py-6 lg:py-10">
        <header className="mb-6">
          <h1 className="font-display text-2xl font-bold text-charcoal lg:text-3xl">Admin</h1>
          <p className="mt-1 text-sm text-charcoal/60">{isAdmin ? "Store management" : "Store management"}</p>
        </header>
        <div className="grid gap-5 lg:grid-cols-[220px_1fr] lg:items-start">
          <AdminNav isAdmin={isAdmin} />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
