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
  <div className="min-h-screen bg-[#f3f3f3] pb-16 pt-3 text-[#171717] sm:pb-10 sm:pt-5">
   <div className="mx-auto w-full max-w-7xl px-2.5 min-[380px]:px-3 sm:px-5 lg:px-7">
    <header className="mb-3 overflow-hidden rounded-[17px] bg-[#202020] text-white shadow-[0_5px_18px_rgba(0,0,0,0.08)] sm:mb-4 sm:rounded-[20px]">
     <div className="flex min-w-0 items-center gap-2.5 px-3 py-3 min-[380px]:gap-3 min-[380px]:px-3.5 sm:gap-4 sm:px-5 sm:py-4">
      <div className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-full border border-white/25 bg-white/10 text-lg font-semibold text-white min-[380px]:size-12 sm:size-14 sm:text-xl">
       {user.avatarUrl ? <Image src={user.avatarUrl} alt="Profile picture" fill sizes="56px" className="object-cover" unoptimized /> : initials}
      </div>
      <div className="min-w-0 flex-1">
       <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-white/55 sm:text-[9px] sm:tracking-[0.2em]">Zed Gift Shop · My account</p>
       <h1 className="mt-0.5 truncate text-[clamp(14px,3.8vw,20px)] font-semibold leading-tight tracking-tight">Welcome back, {user.name.split(" ")[0]}</h1>
       <p className="mt-0.5 truncate text-[10px] text-white/65 sm:text-xs">{user.email}</p>
      </div>
      <Link href="/account/settings" aria-label="Edit profile" className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white hover:text-[#171717] min-[380px]:size-9 sm:h-9 sm:w-auto sm:gap-1.5 sm:px-3 sm:text-[11px]">
       <Pencil className="size-3.5" /><span className="hidden sm:inline">Edit profile</span><ArrowUpRight className="hidden size-3 sm:inline" />
      </Link>
     </div>
     <div className="flex items-center justify-between gap-2 border-t border-white/10 px-3 py-2 text-[9px] text-white/55 min-[380px]:px-3.5 sm:px-5 sm:text-[10px]">
      <span className="truncate">Manage your shopping and personal details</span>
      <Link href="/shop" className="shrink-0 font-semibold text-white/85 transition hover:text-white">Visit shop ↗</Link>
     </div>
    </header>

    <div className="grid min-w-0 items-start gap-2.5 sm:gap-3 lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-4">
     <aside className="min-w-0 lg:sticky lg:top-20"><AccountNav isAdmin={user.role === "ADMIN"} /></aside>
     <main className="min-w-0 rounded-[17px] border border-[#e5e5e5] bg-white p-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)] min-[380px]:p-3.5 sm:rounded-[19px] sm:p-5 lg:p-6">
      {children}
     </main>
    </div>
   </div>
  </div>
 );
}
