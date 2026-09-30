"use client";

import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";

const FLASH_SALE_MS = 3 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000 + 42 * 60 * 1000;

function remaining() {
  const diff = Math.max(0, FLASH_SALE_MS - (Date.now() - START));
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

let START = 0;

export function FlashSaleCountdown() {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    START = Date.now();
    setTime(remaining());
    const id = setInterval(() => setTime(remaining()), 1000);
    return () => clearInterval(id);
  }, []);

  const cells = [
    { label: "Days", value: time.days },
    { label: "Hours", value: time.hours },
    { label: "Minutes", value: time.minutes },
    { label: "Seconds", value: time.seconds },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
      {cells.map((c) => (
        <div
          key={c.label}
          className="min-w-[62px] rounded-lg border border-edge bg-white px-2.5 py-2 text-center"
        >
          <p className="font-display text-xl font-black leading-none text-deep-olive sm:text-2xl">
            {String(c.value).padStart(2, "0")}
          </p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-soft-sage">
            {c.label}
          </p>
        </div>
      ))}
      <span className="ml-1 inline-flex items-center gap-2 rounded-lg bg-deep-olive px-3.5 py-2.5 text-sm font-semibold text-white">
        <ShoppingCart className="size-4" /> Flash Sales
      </span>
    </div>
  );
}
