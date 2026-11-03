"use client";

import { Palette } from "lucide-react";
import type { BrandColorKey } from "@/lib/theme-colors";

type Props = { initial: Record<BrandColorKey, string> };

/** The approved palette is intentionally fixed so off-brand colors cannot be introduced. */
export function ColorsForm({ initial }: Props) {
  void initial;
  const palette = [
    { name: "Royal Plum", hex: "#6C2D5C", role: "Primary brand color" },
    { name: "Dusty Rose", hex: "#D9A0AC", role: "Secondary brand color" },
    { name: "Soft Ivory", hex: "#F3F0EA", role: "Backgrounds and light surfaces" },
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-zed border border-edge bg-white p-6">
        <div className="flex items-center gap-2">
          <Palette className="size-5 text-[#6C2D5C]" />
          <h2 className="font-display text-xl font-bold text-[#171717]">Official brand palette</h2>
        </div>
        <p className="mt-2 text-sm text-[#171717]">
          This palette is applied throughout the storefront, product pages, account, checkout and admin.
          The colors are kept consistent so no unrelated accent colors appear.
        </p>
      </section>
      <div className="grid gap-4 sm:grid-cols-3">
        {palette.map((color) => (
          <section key={color.name} className="rounded-zed border border-edge bg-white p-5">
            <div className="h-24 rounded-xl border border-[#171717]/10" style={{ backgroundColor: color.hex }} />
            <h3 className="mt-4 text-base font-bold text-[#171717]">{color.name}</h3>
            <p className="mt-1 text-sm text-[#171717]/75">{color.role}</p>
            <p className="mt-2 font-mono text-xs font-semibold text-[#6C2D5C]">{color.hex}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
