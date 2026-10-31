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
  <div className="min-h-screen bg-[#f6f3ef] pb-24 pt-5 sm:pb-12 sm:pt-8">
   <div className="container-zed">
    <header className="mb-6 flex items-center justify-between gap-4 sm:mb-8">
     <div>
      <Link href="/shop" className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#9a6b79] hover:text-[#642d42]">Zed Gift Shop</Link>
      <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#2b2026] sm:text-3xl">Your account</h1>
     </div>
     <Link href="/account/settings" aria-label="Edit account profile" className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[#eadfe2] bg-white shadow-sm transition hover:-translate-y-0.5">
      {user.avatarUrl ? <Image src={user.avatarUrl} alt="" fill sizes="48px" className="object-cover" unoptimized /> : <span className="text-lg font-bold text-[#71394f]">{user.name.trim().charAt(0).toUpperCase()}</span>}
     </Link>
    </header>
    <div className="grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)] lg:items-start lg:gap-8">
     <AccountNav isAdmin={user.role === "ADMIN"} />
     <main className="min-w-0">{children}</main>
    </div>
   </div>
  </div>
 );
}
