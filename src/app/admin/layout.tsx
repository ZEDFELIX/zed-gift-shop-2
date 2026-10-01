import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
 const user = await getCurrentUser();
 if (!user) redirect("/login?next=/admin");
 if (!["ADMIN", "STAFF"].includes(user.role)) redirect("/account");

 return (
 <div className="container-zed py-10 lg:py-14">
 <header className="mb-8">
 <p className="eyebrow">Admin | {user.role === "ADMIN" ? "Owner" : "Staff"}</p>
 <h1 className="mt-1 font-display text-3xl font-bold text-[#07111F]">ZED control room</h1>
 </header>
 <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:items-start">
 <AdminNav />
 <div className="min-w-0">{children}</div>
 </div>
 </div>
 );
}