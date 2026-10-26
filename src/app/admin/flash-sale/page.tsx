import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { FlashSaleAdminClient } from "@/components/admin/FlashSaleAdminClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Flash Sale | Admin" };

export default async function FlashSaleAdminPage() {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect("/admin");
  return <FlashSaleAdminClient />;
}
