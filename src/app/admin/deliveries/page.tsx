import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DeliveriesManager } from "@/components/admin/DeliveriesManager";

export const metadata = { title: "Delivery zones | Admin" };

export default async function AdminDeliveriesPage() {
 const user = await getCurrentUser();
 if (user?.role !== "ADMIN") redirect("/admin");
 return <DeliveriesManager />;
}