"use client";

import { useEffect, useMemo, useState } from "react";

function parseTime(value: string): number | null {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function FlashSaleCountdown({
  startsAt = "",
  endsAt = "",
  active = false,
}: {
  startsAt?: string;
  endsAt?: string;
  active?: boolean;
}) {
  const start = useMemo(() => parseTime(startsAt), [startsAt]);
  const end = useMemo(() => parseTime(endsAt), [endsAt]);
  const [now, setNow] = useState(() => Date.now());

  const status = useMemo(() => {
    if (!active) return "off" as const;
    if (start !== null && now < start) return "upcoming" as const;
    if (end !== null && now >= end) return "ended" as const;
    return "live" as const;
  }, [active, start, end, now]);

  const fallbackEnd = useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  }, []);

  useEffect(() => {
    if (status !== "live" && status !== "upcoming") return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [status]);

  if (status === "off") return null;

  if (status === "ended") {
    return (
      <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/80 bg-white/55 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-charcoal/70 shadow-sm backdrop-blur-xl sm:gap-2 sm:px-3 sm:text-[11px]">
        <span className="text-charcoal/60">Sale ended</span>
      </div>
    );
  }

  const target = status === "upcoming" ? start : (end ?? fallbackEnd);
  if (target === null) return null;

  const remaining = Math.max(0, target - now);
  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/80 bg-white/55 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-charcoal/70 shadow-sm backdrop-blur-xl sm:gap-2 sm:px-3 sm:text-[11px]">
      <span className="text-rose-600">{status === "upcoming" ? "Starts in" : "Ends in"}</span>
      <span className="rounded-md bg-rose-500 px-1.5 py-1 text-white tabular-nums">{pad(hours)}</span>
      <span>:</span>
      <span className="rounded-md bg-rose-500 px-1.5 py-1 text-white tabular-nums">{pad(minutes)}</span>
      <span>:</span>
      <span className="rounded-md bg-rose-500 px-1.5 py-1 text-white tabular-nums">{pad(seconds)}</span>
    </div>
  );
}
