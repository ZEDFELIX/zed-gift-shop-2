import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { AccountNav } from "@/components/account/AccountNav";
import { ArrowUpRight, Pencil } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
 const user = await getCurrentUser();
 if (!user) redirect("/login?next=/account");
 const initials = user.name.trim().charAt(0).toUpperCase() || "U";

 return (
  <div className="min-h-screen bg-[#f3f3f3] pb-20 pt-5 text-[#171717] sm:pt-9">
   <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
    <div className="mb-6 overflow-hidden rounded-[26px] bg-[#202020] text-white shadow-[0_12px_35px_rgba(0,0,0,0.10)] sm:mb-8">
     <div className="flex flex-wrap items-center gap-4 px-5 py-5 sm:px-8 sm:py-7">
      <div className="relative grid size-[68px] shrink-0 place-items-center overflow-hidden rounded-full border-2 border-white/25 bg-white/10 text-2xl font-semibold text-white sm:size-20">
       {user.avatarUrl ? <Image src={user.avatarUrl} alt="Profile picture" fill sizes="80px" className="object-cover" unoptimized /> : initials}
      </div>
      <div className="min-w-0 flex-1">
       <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">Zed Gift Shop · My account</p>
       <h1 className="mt-1 truncate text-xl font-semibold tracking-tight sm:text-2xl">Welcome back, {user.name.split(" ")[0]}</h1>
       <p className="mt-1 truncate text-xs text-white/65 sm:text-sm">{user.email}</p>
      </div>
      <Link href="/account/settings" className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-white/20 px-4 text-xs font-semibold text-white transition hover:bg-white hover:text-[#171717]">
       <Pencil className="size-3.5" /> Edit profile <ArrowUpRight className="size-3.5" />
      </Link>
     </div>
     <div className="h-px bg-white/10" />
     <div className="flex items-center justify-between px-5 py-3 text-[10px] text-white/55 sm:px-8">
      <span>Manage your shopping and personal details</span>
      <Link href="/shop" className="font-semibold text-white/85 transition hover:text-white">Visit shop ↗</Link>
     </div>
    </div>

    <div className="grid items-start gap-5 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-7">
     <aside className="min-w-0 lg:sticky lg:top-24">
      <AccountNav isAdmin={user.role === "ADMIN"} />
     </aside>
     <main className="min-w-0 rounded-[24px] border border-[#e5e5e5] bg-white p-4 shadow-[0_3px_16px_rgba(0,0,0,0.025)] sm:p-6 lg:p-8">
      {children}
     </main>
    </div>
   </div>
  </div>
 );
}
