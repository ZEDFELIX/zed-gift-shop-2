import "server-only";

import { prisma } from "@/lib/prisma";

export async function listApprovedReviews(productId: string) {
 return prisma.review.findMany({
 where: { productId, status: "APPROVED" },
 include: { user: { select: { name: true } } },
 orderBy: { createdAt: "desc" },
 take: 50,
 });
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

 const review = await prisma.review.create({
 data: {
 productId: input.productId,
 userId: input.userId,
 orderId: input.orderId,
 rating,
 title: input.title ?? null,
 comment: input.comment ?? null,
 images: input.images ?? [],
 status: "PENDING",
 verifiedPurchase: Boolean(input.orderId),
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
 orderStatus: { in: ["PAID", "PROCESSING", "CUSTOMIZATION", "READY_FOR_DISPATCH", "OUT_FOR_DELIVERY", "DELIVERED"] },
 items: { some: { productId } },
 },
 })
 .then((n) => n > 0);
}