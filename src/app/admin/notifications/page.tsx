import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminNotificationsInbox } from "@/components/admin/AdminNotificationsInbox";
export const dynamic="force-dynamic";
export const metadata={title:"Notifications | Admin"};
export default async function NotificationsPage(){const user=await getCurrentUser();if(!user||!["ADMIN","STAFF"].includes(user.role))redirect("/login?next=/admin/notifications");return <AdminNotificationsInbox/>;}