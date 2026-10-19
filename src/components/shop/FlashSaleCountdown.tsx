"use client";

import { useEffect, useMemo, useState } from "react";

function parseTime(value: string): number | null {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
}

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
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
      <span className="inline-flex items-center rounded-full bg-black/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
        Sale ended
      </span>
    );
  }

  const target = status === "upcoming" ? start : (end ?? fallbackEnd);
  if (target === null) return null;

  const remaining = Math.max(0, target - now);
  const totalSeconds = Math.floor(remaining / 1000);
  const units = [
    { label: "Days", value: Math.floor(totalSeconds / 86400) },
    { label: "Hours", value: Math.floor((totalSeconds % 86400) / 3600) },
    { label: "Mins", value: Math.floor((totalSeconds % 3600) / 60) },
    { label: "Secs", value: totalSeconds % 60 },
  ];

  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end">
      <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">
        {status === "upcoming" ? "Starts in" : "Ends in"}
      </span>
      <div className="flex items-center gap-1.5 sm:gap-2">
        {units.map((u) => (
          <div key={u.label} className="flex flex-col items-center">
            <span className="grid min-w-[2.25rem] place-items-center rounded-lg bg-white px-1.5 py-1 text-base font-extrabold tabular-nums text-rose-600 shadow-sm sm:min-w-[2.75rem] sm:text-xl">
              {u.value > 99 ? u.value : pad(u.value)}
            </span>
            <span className="mt-1 text-[9px] font-bold uppercase tracking-wider opacity-80 sm:text-[10px]">
              {u.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
