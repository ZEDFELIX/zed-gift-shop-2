import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getSetting } from "@/lib/data/settings";
import { TestimonialsManager } from "@/components/admin/TestimonialsManager";
import type { CustomerReview } from "@/components/shop/CustomerReviews";

export const dynamic = "force-dynamic";
export const metadata = { title: "Testimonials | Admin" };

function parse(raw: unknown): CustomerReview[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r): r is Record<string, unknown> => Boolean(r) && typeof r === "object")
    .map((r) => ({
      name: String(r.name ?? ""),
      location: String(r.location ?? ""),
      rating: Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5))),
      text: String(r.text ?? ""),
    }));
}

export default async function AdminTestimonialsPage() {
  const me = await getCurrentUser();
  if (me?.role !== "ADMIN") {
    return (
      <div className="rounded-zed border border-edge bg-white p-6">
        <h2 className="font-display text-xl font-bold text-[#07111F]">Restricted</h2>
        <p className="mt-1 text-sm text-[#334155]">Only the store owner can edit customer reviews.</p>
        <Link href="/admin" className="mt-4 inline-block text-sm font-semibold text-soft-sage hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const raw = await getSetting("customerReviews");
  return <TestimonialsManager initial={parse(raw)} />;
}
