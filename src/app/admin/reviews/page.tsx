import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ReviewsManager } from "@/components/admin/ReviewsManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reviews | Admin" };

export default async function AdminReviewsPage() {
 const reviews = await prisma.review.findMany({
 include: { product: { select: { id: true, name: true, slug: true } }, user: { select: { name: true } } },
 orderBy: [{ status: "asc" }, { createdAt: "desc" }],
 take: 200,
 });

 const pending = reviews.filter((r) => r.status === "PENDING").length;

 return (
 <div className="space-y-4">
 <p className="text-sm text-[#334155]">{pending} pending | {reviews.length} total</p>
 <ReviewsManager reviews={reviews.map((r) => ({
 id: r.id,
 productName: r.product.name,
 productSlug: r.product.slug,
 author: r.user?.name ?? "Guest",
 rating: r.rating,
 title: r.title,
 comment: r.comment,
 status: r.status,
 verifiedPurchase: r.verifiedPurchase,
 createdAt: r.createdAt.toISOString(),
 }))} />
 <p className="text-xs text-[#334155]">
 Public pages only show <Link href="/shop" className="underline">approved</Link> reviews.
 </p>
 </div>
 );
}