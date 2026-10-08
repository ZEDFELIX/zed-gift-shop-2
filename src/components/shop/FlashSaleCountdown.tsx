"use client";

import { useEffect, useMemo, useState } from "react";

export function FlashSaleCountdown() {
  const end = useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  }, []);
  const [remaining, setRemaining] = useState(Math.max(0, end - Date.now()));

  useEffect(() => {
    const id = window.setInterval(() => {
      const next = Math.max(0, end - Date.now());
      setRemaining(next);
      if (next === 0) window.clearInterval(id);
    }, 1000);
    return () => window.clearInterval(id);
  }, [end]);

  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/80 bg-white/55 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-charcoal/70 shadow-sm backdrop-blur-xl sm:gap-2 sm:px-3 sm:text-[11px]">
      <span className="text-rose-600">Ends in</span>
      <span className="rounded-md bg-rose-500 px-1.5 py-1 text-white tabular-nums">{String(hours).padStart(2, "0")}</span>
      <span>:</span>
      <span className="rounded-md bg-rose-500 px-1.5 py-1 text-white tabular-nums">{String(minutes).padStart(2, "0")}</span>
      <span>:</span>
      <span className="rounded-md bg-rose-500 px-1.5 py-1 text-white tabular-nums">{String(seconds).padStart(2, "0")}</span>
    </div>
  );
}
