import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { GiftWrapManager } from "@/components/admin/GiftWrapManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gift wrap | Admin" };

export default async function AdminGiftWrapPage() {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect("/admin");
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold text-[#07111F]">Gift wrap options</h2>
        <p className="mt-1 text-sm text-[#334155]">
          These choices appear on product pages where gift wrap is available. Hidden options stay on past orders.
        </p>
      </div>
      <GiftWrapManager />
    </div>
  );
}
