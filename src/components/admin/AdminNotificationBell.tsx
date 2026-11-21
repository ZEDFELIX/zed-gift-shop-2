"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
export function AdminNotificationBell() {
 const [unread,setUnread]=useState(0);
 useEffect(()=>{let live=true;const load=async()=>{try{const r=await fetch("/api/admin/notifications?unread=true",{cache:"no-store"});if(!r.ok)return;const d=await r.json();if(live)setUnread(Number(d.meta?.unread??0));}catch{}};void load();const timer=window.setInterval(load,60000);return()=>{live=false;window.clearInterval(timer)};},[]);
 return <Link href="/admin/notifications" aria-label={unread?("Notifications, "+unread+" unread"):"Notifications"} title="Notifications" className="relative grid size-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100"><Bell className="size-[17px]"/>{unread>0&&<span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-rose-600 px-1 text-[9px] font-bold text-white">{unread>99?"99+":unread}</span>}</Link>;
}