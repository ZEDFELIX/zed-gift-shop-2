"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import type { ToastType } from "@/lib/toast";

type Toast = { id: number; message: string; type: ToastType };

let nextId = 1;

export function ToastHost() {
 const [toasts, setToasts] = useState<Toast[]>([]);

 useEffect(() => {
 function onToast(e: Event) {
 const detail = (e as CustomEvent<{ message: string; type: ToastType }>).detail;
 const id = nextId++;
 setToasts((t) => [...t, { id, message: detail.message, type: detail.type }]);
 window.setTimeout(() => {
 setToasts((t) => t.filter((x) => x.id !== id));
 }, 3200);
 }
 window.addEventListener("zed:toast", onToast);
 return () => window.removeEventListener("zed:toast", onToast);
 }, []);

 return (
 <div className="pointer-events-none fixed bottom-5 left-1/2 z-[90] flex w-[min(92vw,380px)] -translate-x-1/2 flex-col items-center gap-2" aria-live="polite">
 {toasts.map((t) => (
 <div key={t.id} className="glass-strong flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm animate-[toast-in_0.35s_cubic-bezier(0.16,1,0.3,1)_both]">
 {t.type === "success" && <CheckCircle2 className="size-5 shrink-0 text-soft-sage" />}
 {t.type === "error" && <XCircle className="size-5 shrink-0 text-red-600" />}
 {t.type === "info" && <Info className="size-5 shrink-0 text-deep-olive" />}
 <span className="flex-1 font-medium text-[#07111F]">{t.message}</span>
 </div>
 ))}
 </div>
 );
}