"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, LogOut, Search, Settings2, ShieldCheck, Store } from "lucide-react";
import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";

export function AdminTopBar({ role, email, name }: { role: string; email: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");

  async function logout() {
    if (busy) return;
    setBusy(true);
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch { /* Session redirect below remains available. */ }
    router.push("/login");
    router.refresh();
  }

  function searchProducts(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    if (q) router.push(`/admin/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="zed-admin-topbar sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="container-zed flex min-h-[66px] items-center gap-3">
        <Link href="/admin" className="flex shrink-0 items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-slate-950 text-white"><ShieldCheck className="size-[18px]" /></span>
          <span className="hidden sm:block">
            <span className="block font-display text-[15px] font-bold tracking-tight text-slate-950">ZED GIFT SHOP</span>
            <span className="block text-[9px] font-bold uppercase tracking-[.18em] text-slate-400">Management</span>
          </span>
        </Link>
        <div className="mx-1 hidden h-8 w-px bg-slate-200 sm:block" />
        <form onSubmit={searchProducts} role="search" className="ml-auto flex h-10 min-w-0 max-w-[360px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-slate-400 focus-within:bg-white">
          <Search className="size-4 shrink-0 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search store records" placeholder="Search products, orders, customers..." className="w-full min-w-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" />
          <button type="submit" className="hidden rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 shadow-sm sm:block">Search</button>
        </form>
        <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 md:inline-flex">{role}</span>
        <div className="flex shrink-0 items-center gap-1">
          <AdminNotificationBell />
          <Link href="/account" aria-label="Admin profile" title={name} className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-100"><span className="grid size-8 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">{name.trim().slice(0,1).toUpperCase()}</span><span className="hidden max-w-32 xl:block"><span className="block truncate text-xs font-semibold text-slate-800">{name}</span><span className="block truncate text-[10px] text-slate-400">{email}</span></span></Link>
          {role === "ADMIN" && <Link href="/admin/settings" aria-label="Website settings" title="Website settings" className="grid size-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><Settings2 className="size-[17px]" /></Link>}
          <Link href="/" aria-label="View storefront" title="View storefront" className="grid size-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><Store className="size-[17px]" /></Link>
          <button type="button" onClick={logout} disabled={busy} aria-label="Log out" title="Log out" className="grid size-10 place-items-center rounded-xl text-slate-500 transition hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50">
            {busy ? <Loader2 className="size-[17px] animate-spin" /> : <LogOut className="size-[17px]" />}
          </button>
        </div>
      </div>
    </header>
  );
}
