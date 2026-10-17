"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, LogOut, ShieldCheck, Store, User } from "lucide-react";

export function AdminTopBar({ role, email }: { role: string; email: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Even if the call fails, drop the local session view.
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="border-b border-edge bg-zed-950 text-white">
      <div className="container-zed flex h-14 items-center gap-3">
        <Link href="/admin" className="flex items-center gap-2 font-display text-base font-bold tracking-tight">
          <span className="grid size-8 place-items-center rounded-lg bg-white/15">
            <ShieldCheck className="size-4" />
          </span>
          ZED Admin
        </Link>
        <span className="hidden rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white/80 sm:inline">
          {role}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="mr-1 hidden max-w-44 truncate text-xs text-white/60 md:inline">{email}</span>
          <Link
            href="/"
            className="flex min-h-11 items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-white/85 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Store className="size-4" /> <span className="hidden sm:inline">View shop</span>
          </Link>
          <Link
            href="/account"
            className="flex min-h-11 items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-white/85 transition-colors hover:bg-white/10 hover:text-white"
          >
            <User className="size-4" /> <span className="hidden sm:inline">My account</span>
          </Link>
          <button
            type="button"
            onClick={logout}
            disabled={busy}
            className="flex min-h-11 items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-[13px] font-bold text-white transition-colors hover:bg-white/20 disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
