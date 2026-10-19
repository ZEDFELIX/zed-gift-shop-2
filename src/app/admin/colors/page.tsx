import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/data/settings";
import { BRAND_COLORS, type BrandColorKey } from "@/lib/theme-colors";
import { ColorsForm } from "@/components/admin/ColorsForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Colors | Admin" };

export default async function AdminColorsPage() {
  const me = await getCurrentUser();
  if (me?.role !== "ADMIN") {
    return (
      <div className="space-y-6">
        <div className="rounded-zed border border-edge bg-white p-6">
          <h2 className="font-display text-xl font-bold text-[#07111F]">Restricted</h2>
          <p className="mt-1 text-sm text-[#334155]">
            Only the store owner can change the store colours.
          </p>
          <Link href="/admin" className="mt-4 inline-block text-sm font-semibold text-soft-sage hover:underline">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const s = await getSettings();
  const initial = BRAND_COLORS.reduce(
    (acc, color) => {
      acc[color.key] = String(s[color.key] ?? color.default);
      return acc;
    },
    {} as Record<BrandColorKey, string>,
  );

  return (
    <div className="space-y-6">
      <ColorsForm initial={initial} />
    </div>
  );
}
