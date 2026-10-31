"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function AppLaunchScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (!standalone) {
      setVisible(false);
      return;
    }

    const timer = window.setTimeout(() => setVisible(false), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-label="Opening Zed Gift Shop"
      className="fixed inset-0 z-[9999] flex min-h-dvh items-center justify-center overflow-hidden bg-[#FAF8F5] px-7 text-center"
    >
      <div className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-[#6B2D5C]/[0.07] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-24 size-80 rounded-full bg-[#C9A0DC]/[0.13] blur-3xl" />

      <div className="relative flex w-full max-w-xs flex-col items-center">
        <div className="mb-7 grid size-28 place-items-center rounded-[2rem] border border-[#E8E2DC] bg-white shadow-[0_18px_55px_-30px_rgba(84,36,71,.42)]">
          <Image
            src="/logo.png"
            alt="Zed Gift Shop logo"
            width={190}
            height={68}
            priority
            className="h-auto max-h-16 w-[88px] object-contain"
          />
        </div>

        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#8A7484]">
          Welcome to
        </p>
        <h1 className="mt-2 text-[25px] font-extrabold tracking-[-0.045em] text-[#211923]">
          ZED GIFT SHOP
        </h1>
        <p className="mt-2 text-sm font-medium tracking-wide text-[#716772]">
          Gifts For Every Occasion
        </p>

        <div className="mt-9 h-1 w-24 overflow-hidden rounded-full bg-[#E9E1E8]">
          <div className="h-full w-2/5 animate-[zed-launch-progress_1.1s_ease-in-out_infinite] rounded-full bg-[#6B2D5C]" />
        </div>
        <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9A8E98]">
          Thoughtful gifts, beautifully chosen
        </p>
      </div>

      <style jsx>{`
        @keyframes zed-launch-progress {
          0% { transform: translateX(-110%); }
          100% { transform: translateX(260%); }
        }
      `}</style>
    </div>
  );
}
