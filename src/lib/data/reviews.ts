import "server-only";

import { prisma } from "@/lib/prisma";
import type { OrderStatus, Prisma } from "@prisma/client";

/** Order states that count as a completed purchase for a verified review badge. */
const PURCHASED_STATUSES: OrderStatus[] = [
 "PAID",
 "PROCESSING",
 "CUSTOMIZATION",
 "PACKED",
 "READY_FOR_DISPATCH",
 "DISPATCHED",
 "OUT_FOR_DELIVERY",
 "DELIVERED",
];

export type ReviewCard = {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  images: string[];
  verifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: Date;
  authorName: string;
  productId: string;
  productName: string;
  productSlug: string;
};

function toCard(r: {
  id: string; rating: number; title: string | null; comment: string | null;
  images: string[]; verifiedPurchase: boolean; helpfulCount: number; createdAt: Date;
  user: { name: string } | null; product: { id: string; name: string; slug: string };
}): ReviewCard {
  return {
    id: r.id, rating: r.rating, title: r.title, comment: r.comment,
    images: r.images, verifiedPurchase: r.verifiedPurchase, helpfulCount: r.helpfulCount,
    createdAt: r.createdAt, authorName: r.user?.name ?? "Verified customer",
    productId: r.product.id, productName: r.product.name, productSlug: r.product.slug,
  };
}

const CARD_INCLUDE = {
  user: { select: { name: true } },
  product: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.ReviewInclude;

export async function listApprovedReviews(productId: string) {
 return prisma.review.findMany({
  where: { productId, status: "APPROVED" },
  include: CARD_INCLUDE,
  orderBy: { createdAt: "desc" },
  take: 50,
  }).then((rows) => rows.map(toCard));
}

/** Public reviews listing: filters, sorting and pagination for /reviews. */
export async function listPublicReviews(opts: {
  rating?: number;
  productSlug?: string;
  sort: "newest" | "helpful";
  page: number;
  perPage: number;
}): Promise<{ reviews: ReviewCard[]; total: number; pageCount: number }> {
  const filters: Prisma.ReviewWhereInput[] = [{ status: "APPROVED" }];
  if (opts.rating) filters.push({ rating: opts.rating });
  if (opts.productSlug) filters.push({ product: { slug: opts.productSlug } });
  const where = { AND: filters };

  const [total, rows] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      include: CARD_INCLUDE,
      orderBy: opts.sort === "helpful"
        ? [{ helpfulCount: "desc" }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }],
      skip: (opts.page - 1) * opts.perPage,
      take: opts.perPage,
    }),
  ]);

  return {
    reviews: rows.map(toCard),
    total,
    pageCount: Math.max(1, Math.ceil(total / opts.perPage)),
  };
}

/** Aggregate stats over ALL approved reviews for the /reviews page header. */
export async function reviewStats(): Promise<{
  total: number;
  average: number;
  buckets: { star: number; count: number; percent: number }[];
  verifiedCount: number;
}> {
  const rows = await prisma.review.groupBy({
    by: ["rating"],
    where: { status: "APPROVED" },
    _count: { rating: true },
  });
  const byStar = new Map(rows.map((r) => [r.rating, r._count.rating]));
  const buckets = [5, 4, 3, 2, 1].map((star) => {
    const count = byStar.get(star) ?? 0;
    return { star, count, percent: 0 };
  });
  const total = rows.reduce((s, r) => s + r._count.rating, 0);
  const weighted = rows.reduce((s, r) => s + r.rating * r._count.rating, 0);
  for (const b of buckets) b.percent = total ? Math.round((b.count / total) * 100) : 0;

  const verifiedCount = await prisma.review.count({ where: { status: "APPROVED", verifiedPurchase: true } });

  return {
    total,
    average: total ? Math.round((weighted / total) * 10) / 10 : 0,
    buckets,
    verifiedCount,
  };
}

/** Signed-in customers toggle one "helpful" vote per review. */
export async function toggleHelpfulVote(reviewId: string, userId: string): Promise<{ voted: boolean; helpfulCount: number }> {
  const review = await prisma.review.findUnique({ where: { id: reviewId }, select: { id: true } });
  if (!review) throw new Error("REVIEW_NOT_FOUND");

  return prisma.$transaction(async (tx) => {
    const vote = await tx.reviewVote.findUnique({
      where: { reviewId_userId: { reviewId, userId } },
      select: { id: true },
    });
    let voted: boolean;
    if (vote) {
      await tx.reviewVote.delete({ where: { id: vote.id } });
      voted = false;
    } else {
      await tx.reviewVote.create({ data: { reviewId, userId } });
      voted = true;
    }
    const helpfulCount = await tx.reviewVote.count({ where: { reviewId } });
    await tx.review.update({ where: { id: reviewId }, data: { helpfulCount } });
    return { voted, helpfulCount };
  });
}

/** Record a report; one report per user per review (guests allowed, IP rate-limited). */
export async function reportReview(reviewId: string, reason: string, userId: string | null): Promise<{ ok: true; duplicate: boolean }> {
  const review = await prisma.review.findUnique({ where: { id: reviewId }, select: { id: true } });
  if (!review) throw new Error("REVIEW_NOT_FOUND");
  if (!userId) {
    await prisma.reviewReport.create({ data: { reviewId, reason } });
    return { ok: true, duplicate: false };
  }
  const existing = await prisma.reviewReport.findFirst({
    where: { reviewId, userId },
    select: { id: true },
  });
  if (existing) return { ok: true, duplicate: true };
  await prisma.reviewReport.create({ data: { reviewId, reason, userId } });
  return { ok: true, duplicate: false };
}

/** Unresolved reports for the admin dashboard. */
export async function listUnresolvedReports(take = 100) {
  return prisma.reviewReport.findMany({
    where: { resolved: false },
    include: {
      review: {
        include: {
          product: { select: { name: true, slug: true } },
          user: { select: { name: true } },
        },
      },
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function markReportResolved(id: string) {
  return prisma.reviewReport.update({ where: { id }, data: { resolved: true } });
}

export async function createReview(input: {
 productId: string;
 userId: string | null;
 orderId?: string | null;
 rating: number;
 title?: string | null;
 comment?: string | null;
 images?: string[];
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
 const rating = Math.max(1, Math.min(5, Math.round(input.rating)));

 if (!input.userId) {
 const product = await prisma.product.findUnique({ where: { id: input.productId }, select: { id: true } });
 if (!product) return { ok: false, error: "Product not found." };
 const review = await prisma.review.create({
 data: {
 productId: input.productId,
 rating,
 title: input.title ?? null,
 comment: input.comment ?? null,
 images: input.images ?? [],
 status: "PENDING",
 },
 });
 return { ok: true, id: review.id };
 }

 const existing = await prisma.review.findFirst({
 where: { userId: input.userId, productId: input.productId },
 select: { id: true },
 });
 if (existing) return { ok: false, error: "You have already reviewed this product." };

 // Auto-link to the customer's own order for this product so the review earns
 // the honest "verified purchase" badge without the shopper doing anything.
 let orderId = input.orderId ?? null;
 if (!orderId) {
 const order = await prisma.order.findFirst({
 where: {
 userId: input.userId,
 orderStatus: { in: PURCHASED_STATUSES },
 items: { some: { productId: input.productId } },
 },
 select: { id: true },
 orderBy: { createdAt: "desc" },
 });
 orderId = order?.id ?? null;
 }

 const review = await prisma.review.create({
 data: {
 productId: input.productId,
 userId: input.userId,
 orderId,
 rating,
 title: input.title ?? null,
 comment: input.comment ?? null,
 images: input.images ?? [],
 status: "PENDING",
 verifiedPurchase: Boolean(orderId),
 },
 });
 return { ok: true, id: review.id };
}

export function ratingBreakdown(reviews: { rating: number }[]) {
 const count = reviews.length;
 const buckets = [5, 4, 3, 2, 1].map((star) => {
 const n = reviews.filter((r) => r.rating === star).length;
 return { star, count: n, percent: count ? Math.round((n / count) * 100) : 0 };
 });
 const average = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
 return { count, average: Math.round(average * 10) / 10, buckets };
}

export function recalcProductRating(productId: string) {
 return prisma.$transaction(async (tx) => {
 const agg = await tx.review.aggregate({
 where: { productId, status: "APPROVED" },
 _count: true,
 _avg: { rating: true },
 });
 await tx.product.update({
 where: { id: productId },
 data: { ratingCount: agg._count, ratingAverage: agg._avg.rating ?? 0 },
 });
 });
}

export function hasPurchased(userId: string, productId: string): Promise<boolean> {
 return prisma.order
 .count({
 where: {
 userId,
 orderStatus: { in: PURCHASED_STATUSES },
 items: { some: { productId } },
 },
 })
 .then((n) => n > 0);
}