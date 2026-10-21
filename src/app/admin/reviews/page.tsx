import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { listUnresolvedReports } from "@/lib/data/reviews";
import { ReviewsManager, type AdminReviewRow, type AdminReportRow } from "@/components/admin/ReviewsManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reviews | Admin" };

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    include: { product: { select: { id: true, name: true, slug: true } }, user: { select: { name: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
  });
  const reports = await listUnresolvedReports(50);

  const pending = reviews.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#334155]">{pending} pending | {reviews.length} total</p>
      <ReviewsManager
        reviews={reviews.map((r): AdminReviewRow => ({
          id: r.id,
          productName: r.product.name,
          productSlug: r.product.slug,
          author: r.user?.name ?? "Guest",
          rating: r.rating,
          title: r.title,
          comment: r.comment,
          images: r.images,
          status: r.status,
          verifiedPurchase: r.verifiedPurchase,
          helpfulCount: r.helpfulCount,
          createdAt: r.createdAt.toISOString(),
        }))}
        reports={reports.map((rep): AdminReportRow => ({
          id: rep.id,
          reason: rep.reason,
          createdAt: rep.createdAt.toISOString(),
          reportedBy: rep.user?.name ?? "Guest",
          reviewId: rep.review.id,
          reviewRating: rep.review.rating,
          reviewTitle: rep.review.title,
          reviewAuthor: rep.review.user?.name ?? "Guest",
          reviewProduct: rep.review.product.name,
          reviewProductSlug: rep.review.product.slug,
        }))}
      />
      <p className="text-xs text-[#334155]">
        Public pages only show <Link href="/reviews" className="underline">approved</Link> reviews.
      </p>
    </div>
  );
}
