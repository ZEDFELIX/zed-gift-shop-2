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
      <span className="inline-flex items-center rounded-full bg-black/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wide">
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
    <div
      className="flash-sale-countdown flex shrink-0 items-center gap-1"
      aria-label={`${status === "upcoming" ? "Sale starts in" : "Sale ends in"} ${units.map((u) => `${u.value} ${u.label.toLowerCase()}`).join(", ")}`}
    >
      <span className="whitespace-nowrap text-[8px] font-extrabold uppercase tracking-wide opacity-80 sm:text-[9px]">
        {status === "upcoming" ? "Starts" : "Ends"}
      </span>
      <div className="flex items-center gap-0.5">
        {units.map((u) => (
          <span
            key={u.label}
            className="grid min-w-[1.3rem] place-items-center rounded-md bg-white px-1 py-1 text-[10px] font-extrabold leading-none tabular-nums text-rose-600 shadow-sm sm:min-w-[1.55rem] sm:text-[11px]"
            title={u.label}
          >
            {u.value > 99 ? u.value : pad(u.value)}
          </span>
        ))}
      </div>
    </div>
  );
}
