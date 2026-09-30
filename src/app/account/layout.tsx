import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AccountNav } from "@/components/account/AccountNav";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
 const user = await getCurrentUser();
 if (!user) {
 redirect("/login?next=/account");
 }

 return (
 <div className="container-zed py-10 lg:py-14">
 <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
 <div>
 <p className="eyebrow">My account</p>
 <h1 className="mt-1 font-display text-3xl font-bold text-[#171717]">Hello, {user.name.split(" ")[0]}</h1>
 </div>
 </header>
 <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:items-start">
 <AccountNav />
 <div className="min-w-0">{children}</div>
 </div>
 </div>
 );
}