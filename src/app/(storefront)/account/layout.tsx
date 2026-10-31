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
 const initials = user.name.trim().charAt(0).toUpperCase() || "U";

 return (
  <div className="min-h-screen bg-[#f7f7f7] pb-24 pt-8 text-[#171717] sm:pb-12 sm:pt-12">
   <div className="container-zed mx-auto max-w-6xl">
    <header className="mx-auto mb-8 flex max-w-xl flex-col items-center text-center sm:mb-10">
     <Link href="/account/settings" aria-label="Edit profile" className="group relative mb-4 grid size-28 place-items-center overflow-hidden rounded-full border border-[#e5e5e5] bg-white shadow-sm transition hover:shadow-md sm:size-32">
      {user.avatarUrl ? <Image src={user.avatarUrl} alt="Profile picture" fill sizes="128px" className="object-cover" unoptimized /> : <span className="text-4xl font-semibold text-[#555]">{initials}</span>}
      <span className="absolute inset-x-0 bottom-0 bg-black/65 py-1.5 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">Edit photo</span>
     </Link>
     <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#777]">Zed Gift Shop account</p>
     <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#171717] sm:text-3xl">{user.name}</h1>
     <p className="mt-1 text-sm text-[#737373]">{user.email}</p>
     <Link href="/account/settings" className="mt-4 inline-flex min-h-9 items-center rounded-full border border-[#d8d8d8] bg-white px-4 text-xs font-semibold text-[#333] transition hover:border-[#999] hover:bg-[#f0f0f0]">Edit profile</Link>
    </header>

    <AccountNav isAdmin={user.role === "ADMIN"} />
    <main className="mx-auto mt-7 min-w-0 max-w-5xl sm:mt-9">{children}</main>
   </div>
  </div>
 );
}
