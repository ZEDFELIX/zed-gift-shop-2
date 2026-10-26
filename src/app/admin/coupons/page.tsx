import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { CouponsManager } from "@/components/admin/CouponsManager";

export const metadata = { title: "Coupons | Admin" };

export default async function AdminCouponsPage() {
 const user = await getCurrentUser();
 if (user?.role !== "ADMIN") redirect("/admin");
 return <CouponsManager />;
}