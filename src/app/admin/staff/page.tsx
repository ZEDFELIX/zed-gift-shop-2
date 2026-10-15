import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { StaffManager } from "@/components/admin/StaffManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Staff | Admin" };

export default async function AdminStaffPage() {
  const me = await getCurrentUser();
  if (me?.role !== "ADMIN") {
    return (
      <div className="rounded-zed border border-edge bg-white p-6">
        <h2 className="font-display text-xl font-bold text-[#07111F]">Restricted</h2>
        <p className="mt-1 text-sm text-[#334155]">
          Only the store owner can add or remove staff accounts.
        </p>
        <Link href="/admin" className="mt-4 inline-block text-sm font-semibold text-soft-sage hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }
  const staff = await prisma.user.findMany({
    where: { role: { in: ["STAFF", "ADMIN"] } },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#334155]">
        You&apos;re the owner - you can add teammates with staff access.
      </p>
      <StaffManager
        canAdd
        staff={staff.map((s) => ({ id: s.id, name: s.name, email: s.email, role: s.role === "ADMIN" ? "ADMIN" : "STAFF", createdAt: s.createdAt.toISOString() }))}
      />
    </div>
  );
}
