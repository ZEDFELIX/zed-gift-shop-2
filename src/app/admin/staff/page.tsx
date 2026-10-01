import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { StaffManager } from "@/components/admin/StaffManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Staff | Admin" };

export default async function AdminStaffPage() {
 const me = await getCurrentUser();
 const staff = await prisma.user.findMany({
 where: { role: { in: ["STAFF", "ADMIN"] } },
 select: { id: true, name: true, email: true, role: true, createdAt: true },
 orderBy: { createdAt: "asc" },
 });

 return (
 <div className="space-y-4">
 <p className="text-sm text-[#334155]">
 {me?.role === "ADMIN" ? "You're the owner - you can add teammates with staff access." : "Only the owner can manage staff."}
 </p>
 <StaffManager
 canAdd={me?.role === "ADMIN"}
 staff={staff.map((s) => ({ id: s.id, name: s.name, email: s.email, role: s.role === "ADMIN" ? "ADMIN" : "STAFF", createdAt: s.createdAt.toISOString() }))}
 />
 </div>
 );
}