import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { AccountNav } from "@/components/account/AccountNav";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
 const user = await getCurrentUser();
 if (!user) redirect("/login?next=/account");

 return (
  <div className="min-h-[75vh] bg-[#f7f7f7] pb-24 pt-4 sm:pb-10 sm:pt-8">
   <div className="container-zed">
    <header className="mb-4 flex items-center justify-between gap-3 sm:mb-6">
     <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#829b4d]">Your personal space</p>
      <h1 className="mt-1 text-xl font-extrabold text-[#252525] sm:text-2xl">My account</h1>
     </div>
     <Link href="/account/settings" aria-label="Edit account profile" className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-white bg-[#eaf1dc] shadow-sm">
      {user.avatarUrl ? <Image src={user.avatarUrl} alt="" fill sizes="44px" className="object-cover" unoptimized /> : <span className="text-sm font-extrabold text-[#718f35]">{user.name.trim().charAt(0).toUpperCase()}</span>}
     </Link>
    </header>
    <div className="grid gap-4 lg:grid-cols-[230px_minmax(0,1fr)] lg:items-start lg:gap-6">
     <AccountNav isAdmin={user.role === "ADMIN"} />
     <main className="min-w-0">{children}</main>
    </div>
   </div>
  </div>
 );
}