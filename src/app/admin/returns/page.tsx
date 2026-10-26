import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ReturnsManager } from "@/components/admin/ReturnsManager";
import { RotateCcw } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Returns | Admin" };

export default async function AdminReturnsPage() {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect("/admin");
  return (
    <div className="space-y-4">
      <div>
        <p className="eyebrow text-soft-sage">Support</p>
        <h1 className="mt-1 flex items-center gap-2 font-display text-2xl font-black text-[#07111F]">
          <RotateCcw className="size-5" /> Returns & exchanges
        </h1>
        <p className="mt-1 text-sm text-[#334155]">
          Customer self-service return requests from the account area. Change a status to keep the customer informed.
        </p>
      </div>
      <ReturnsManager />
    </div>
  );
}
