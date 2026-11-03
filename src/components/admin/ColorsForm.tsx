"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Palette, RotateCcw, Save } from "lucide-react";
import { BRAND_COLORS, isHexColor, type BrandColorKey } from "@/lib/theme-colors";

type Props = { initial: Record<BrandColorKey, string>; initialTextColors?: { heading: string; body: string; muted: string; button: string }; initialPageThemes?: Record<string, { background: string; text: string; heading: string; primary: string; button: string; buttonText: string; card: string }> };

/** Picks readable label text (dark or white) for any background colour. */
function readable(hex: string): string {
  if (!isHexColor(hex)) return "#FFFFFF";
  const n = parseInt(hex.trim().slice(1), 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.6 ? "#07111F" : "#FFFFFF";
}

export function ColorsForm({ initial, initialTextColors, initialPageThemes }: Props) {
  const router = useRouter();
  const [colors, setColors] = useState<Record<BrandColorKey, string>>(initial);
  const [textColors, setTextColors] = useState(initialTextColors ?? { heading: "#171717", body: "#29232B", muted: "#716772", button: "#FFFFFF" });
  const pageNames = [{ key: "home", label: "Home", path: "/" }, { key: "shop", label: "Shop", path: "/shop" }, { key: "product", label: "Product details", path: "/product" }, { key: "cart", label: "Cart", path: "/cart" }, { key: "checkout", label: "Checkout", path: "/checkout" }, { key: "account", label: "Account", path: "/account" }, { key: "wrap-a-gift", label: "Wrap a Gift", path: "/wrap-a-gift" }, { key: "contact", label: "Contact", path: "/contact" }, { key: "about", label: "About", path: "/about" }, { key: "blog", label: "Blog", path: "/blog" }];
  const defaultPage = { background: "#FAFAF7", text: "#29232B", heading: "#171717", primary: "#6C2D5C", button: "#263746", buttonText: "#FFFFFF", card: "#FFFFFF" };
  const [pageThemes, setPageThemes] = useState<Record<string, typeof defaultPage>>(() => Object.fromEntries(pageNames.map(p => [p.key, { ...defaultPage, ...(initialPageThemes?.[p.key] ?? {}) }])));
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function set(key: BrandColorKey, value: string) {
    setColors((c) => ({ ...c, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const invalid = BRAND_COLORS.find((c) => !isHexColor(colors[c.key]));
    if (invalid) {
      setError(`${invalid.label} must be a hex value like #E5397F.`);
      setStatus("error");
      return;
    }
    setBusy(true);
    setStatus("idle");
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: { ...colors, textColors, pageThemes } }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Couldn't save colours.");
        setStatus("error");
        return;
      }
      setStatus("saved");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <section className="rounded-zed border border-edge bg-white p-6">
        <div className="flex items-center gap-2">
          <Palette className="size-5 text-soft-sage" />
          <h2 className="font-display text-xl font-bold text-[#07111F]">Colours</h2>
        </div>
        <p className="mt-1 text-sm text-[#334155]">
          These colours theme the entire storefront, plus receipts and invoices. Use the colour picker or enter any HEX value to customise each brand colour. Saved colours update the storefront theme, including buttons, accents, backgrounds and the announcement bar.
        </p>
      </section>

      <section className="rounded-zed border border-edge bg-white p-6">
        <h2 className="font-display text-lg font-bold text-[#07111F]">Brand palette presets</h2>
        <p className="mt-1 text-sm text-[#334155]">Apply the approved palette as a starting point, then customise every colour below with the colour picker or HEX value.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { name: "Royal Plum", hex: "#6C2D5C", role: "Primary + announcement" },
            { name: "Midnight Slate", hex: "#263746", role: "Secondary" },
            { name: "Accent Violet", hex: "#7C3AED", role: "Accent" },
            { name: "Milk White", hex: "#FAFAF7", role: "Background" },
          ].map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => {
                const key = preset.name === "Royal Plum" ? "primaryColor" : preset.name === "Midnight Slate" ? "secondaryColor" : preset.name === "Accent Violet" ? "accentColor" : "backgroundColor";
                set(key, preset.hex);
                if (preset.name === "Royal Plum") set("announcementColor", preset.hex);
              }}
              className="flex items-center gap-3 rounded-xl border border-edge p-3 text-left transition hover:border-[#6C2D5C] hover:bg-panel/50"
            >
              <span className="size-10 shrink-0 rounded-lg border border-black/10" style={{ backgroundColor: preset.hex }} />
              <span className="min-w-0">
                <span className="block text-sm font-bold text-[#07111F]">{preset.name}</span>
                <span className="block text-xs text-[#64748B]">{preset.hex} · {preset.role}</span>
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setColors((current) => ({
            ...current,
            primaryColor: "#6C2D5C",
            secondaryColor: "#263746",
            backgroundColor: "#FAFAF7",
            accentColor: "#7C3AED",
            announcementColor: "#6C2D5C",
          }))}
          className="mt-3 rounded-md bg-[#263746] px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
        >
          Apply complete brand palette
        </button>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {BRAND_COLORS.map((color) => (
          <section key={color.key} className="rounded-zed border border-edge bg-white p-6">
            <div className="flex items-start gap-4">
              <span
                className="size-14 shrink-0 rounded-xl border border-black/10 shadow-inner"
                style={{ backgroundColor: isHexColor(colors[color.key]) ? colors[color.key] : "#ffffff" }}
                aria-hidden
              />
              <div className="min-w-0">
                <h3 className="font-display text-base font-bold text-[#07111F]">{color.label}</h3>
                <p className="mt-0.5 text-sm text-[#334155]">{color.description}</p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <input
                type="color"
                value={isHexColor(colors[color.key]) ? colors[color.key] : "#000000"}
                onChange={(e) => set(color.key, e.target.value)}
                className="h-11 w-14 shrink-0 rounded-md border border-edge bg-white p-1"
                aria-label={`${color.label} picker`}
              />
              <input
                className="field"
                value={colors[color.key]}
                onChange={(e) => set(color.key, e.target.value)}
                spellCheck={false}
                maxLength={7}
                placeholder="#E5397F"
                aria-label={`${color.label} hex value`}
              />
              <button
                type="button"
                onClick={() => set(color.key, color.default)}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-edge text-[#334155] hover:border-rose-300 hover:text-rose-600"
                aria-label={`Reset ${color.label} to default`}
                title={`Reset to ${color.default}`}
              >
                <RotateCcw className="size-4" />
              </button>
            </div>

            <div className="mt-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-soft-sage">What it changes</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {color.usedFor.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-edge bg-panel/60 px-2.5 py-1 text-[11px] font-medium text-[#334155]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>

      <section className="rounded-zed border border-edge bg-white p-6">
        <h2 className="font-display text-xl font-bold text-[#07111F]">Live preview</h2>
        <p className="mt-1 text-sm text-[#334155]">A sample of how your colours appear on the storefront.</p>
        <div
          className="mt-4 overflow-hidden rounded-xl border border-edge"
          style={{ backgroundColor: colors.backgroundColor }}
        >
          <div
            className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider"
            style={{ backgroundColor: colors.announcementColor, color: readable(colors.announcementColor) }}
          >
            Same day delivery in Nairobi →
          </div>
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ backgroundColor: colors.secondaryColor, color: readable(colors.secondaryColor) }}
          >
            <span className="text-sm font-bold">ZED GIFT SHOP</span>
            <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-[11px] font-semibold">Cart (2)</span>
          </div>
          <div className="p-5">
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white"
              style={{ backgroundColor: colors.primaryColor }}
            >
              Sale -20%
            </span>
            <p className="mt-3 font-semibold text-[#07111F]">Personalised Gift Box</p>
            <p className="text-lg font-bold" style={{ color: colors.primaryColor }}>
              KSh 3,500
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span
                className="rounded-md px-4 py-2 text-xs font-bold text-white"
                style={{ backgroundColor: colors.secondaryColor }}
              >
                Add to cart
              </span>
              <span
                className="rounded-md px-4 py-2 text-xs font-semibold"
                style={{ color: colors.accentColor, border: `1px solid ${colors.accentColor}` }}
              >
                Accent detail
              </span>
            </div>
          </div>
        </div>
      </section>

      {status === "error" && <p className="rounded-zed bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {status === "saved" && <p className="rounded-zed bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Colours saved.</p>}

      <button
        type="submit"
        disabled={busy}
        className="flex items-center gap-2 rounded-zed bg-zed-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save colours
      </button>
    </form>
  );
}
