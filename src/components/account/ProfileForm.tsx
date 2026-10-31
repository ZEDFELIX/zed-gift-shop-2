"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, Check, Loader2, UserRound } from "lucide-react";

export function ProfileForm({ name, email, phone, avatarUrl }: { name: string; email: string; phone: string | null; avatarUrl?: string | null }) {
 const router = useRouter();
 const fileRef = useRef<HTMLInputElement>(null);
 const [form, setForm] = useState({ name, email, phone: phone ?? "" });
 const [avatar, setAvatar] = useState(avatarUrl ?? "");
 const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
 const [uploading, setUploading] = useState(false);
 const [error, setError] = useState<string | null>(null);

 async function uploadAvatar(file?: File) {
  if (!file) return;
  setError(null);
  setUploading(true);
  const body = new FormData();
  body.append("avatar", file);
  try {
   const res = await fetch("/api/account/profile/avatar", { method: "POST", body });
   const data = await res.json() as { error?: string; avatarUrl?: string };
   if (!res.ok || !data.avatarUrl) throw new Error(data.error ?? "Couldn't upload your photo.");
   setAvatar(data.avatarUrl);
   router.refresh();
  } catch (err) {
   setError(err instanceof Error ? err.message : "Couldn't upload your photo.");
  } finally { setUploading(false); }
 }

 async function submit(e: React.FormEvent) {
  e.preventDefault();
  setStatus("saving"); setError(null);
  try {
   const res = await fetch("/api/account/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
   const data = await res.json() as { error?: string; user?: { name: string; email: string; phone: string | null } };
   if (!res.ok || !data.user) throw new Error(data.error ?? "Couldn't update your profile.");
   setForm({ name: data.user.name, email: data.user.email, phone: data.user.phone ?? "" });
   setStatus("saved"); router.refresh();
  } catch (err) {
   setError(err instanceof Error ? err.message : "Couldn't update your profile.");
   setStatus("error");
  }
 }

 return (
  <form onSubmit={submit} className="overflow-hidden rounded-3xl border border-[#e9e9e9] bg-white shadow-sm">
   <div className="border-b border-[#f0f0f0] px-4 py-4 sm:px-6">
    <h2 className="text-base font-extrabold text-[#242424]">Personal information</h2>
    <p className="mt-1 text-xs text-[#777]">Manage your details and profile photo</p>
   </div>
   <div className="space-y-5 p-4 sm:p-6">
    <div className="flex items-center gap-4">
     <div className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-[#edf3df] bg-[#f3f5ee]">
      {avatar ? <Image src={avatar} alt="Your profile photo" fill sizes="80px" className="object-cover" unoptimized /> : <UserRound className="size-9 text-[#8aa83d]" />}
     </div>
     <div className="min-w-0">
      <p className="text-sm font-bold text-[#252525]">Profile picture</p>
      <p className="mt-0.5 text-xs text-[#777]">JPG, PNG or WebP · up to 3 MB</p>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => uploadAvatar(e.target.files?.[0])} />
      <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className="mt-2 inline-flex min-h-9 items-center gap-2 rounded-full bg-[#eaf1dc] px-4 text-xs font-bold text-[#66872b] disabled:opacity-60">
       {uploading ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />} {uploading ? "Uploading…" : "Change photo"}
      </button>
     </div>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
     <div><label className="mb-1.5 block text-xs font-semibold text-[#555]" htmlFor="p-name">Full name</label><input id="p-name" className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
     <div><label className="mb-1.5 block text-xs font-semibold text-[#555]" htmlFor="p-phone">Phone number</label><input id="p-phone" className="field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="tel" placeholder="07XX XXX XXX" /></div>
     <div className="sm:col-span-2"><label className="mb-1.5 block text-xs font-semibold text-[#555]" htmlFor="p-email">Email address</label><input id="p-email" type="email" className="field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
    </div>
    {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    {status === "saved" && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Your profile has been updated.</p>}
    <button type="submit" disabled={status === "saving"} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#91ad3b] px-6 text-sm font-bold text-[#1e2b0d] disabled:opacity-50">
     {status === "saving" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Save changes
    </button>
   </div>
  </form>
 );
}
