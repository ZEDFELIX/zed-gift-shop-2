import "server-only";

import { prisma } from "@/lib/prisma";
import { sendPaymentReminder, sendReviewRequest } from "@/lib/email";
import { notifyAdmins } from "@/lib/notifications";
import { SITE } from "@/lib/constants";
import { logger } from "@/lib/logger";

/**
 * Scheduled maintenance run from the daily Vercel cron. Each task is
 * best-effort and independent: one failing task must not stop the others.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Ask recent customers to review what they received, exactly once per order. */
export async function sendDueReviewRequests(): Promise<number> {
 const now = Date.now();
 // Delivered at least 3 days ago (time to actually use the gift) but not older
 // than 30 days, so we never mass-mail ancient orders when this first runs.
 const notBefore = new Date(now - 30 * DAY_MS);
 const notAfter = new Date(now - 3 * DAY_MS);

 const orders = await prisma.order.findMany({
 where: {
 orderStatus: "DELIVERED",
 reviewRequestedAt: null,
 email: { not: "" },
 updatedAt: { gte: notBefore, lte: notAfter },
 },
 select: {
 id: true,
 orderNumber: true,
 email: true,
 userId: true,
 items: {
 take: 1,
 select: { productId: true, name: true, product: { select: { slug: true } } },
 },
 },
 orderBy: { updatedAt: "asc" },
 take: 200,
 });

 let sent = 0;
 for (const order of orders) {
 try {
 const item = order.items[0];

 // Don't nag a customer who already reviewed this product.
 let alreadyReviewed = false;
 if (order.userId && item?.productId) {
 alreadyReviewed = Boolean(
 await prisma.review.findFirst({
 where: { userId: order.userId, productId: item.productId },
 select: { id: true },
 }),
 );
 }

 // Stamp first so a mail failure never causes a repeat attempt.
 await prisma.order.update({ where: { id: order.id }, data: { reviewRequestedAt: new Date() } });

 if (alreadyReviewed) continue;

 const reviewUrl = item?.product?.slug
 ? `${SITE.url.replace(/\/$/, "")}/product/${item.product.slug}#reviews`
 : `${SITE.url.replace(/\/$/, "")}/shop`;

 await sendReviewRequest({
 to: order.email,
 orderNumber: order.orderNumber,
 productName: item?.name ?? null,
 reviewUrl,
 });
 sent += 1;
 } catch (error) {
 logger.error("cron.review_request_failed", {
 orderId: order.id,
 error: error instanceof Error ? error.message : String(error),
 });
 }
 }
 return sent;
}

/** Remind customers whose order was created but never paid, once each. */
export async function sendAbandonedCheckoutReminders(): Promise<number> {
 const now = Date.now();
 const notBefore = new Date(now - 48 * DAY_MS);
 const notAfter = new Date(now - 3 * DAY_MS);

 const orders = await prisma.order.findMany({
 where: {
 orderStatus: "PENDING_PAYMENT",
 paymentReminderAt: null,
 email: { not: "" },
 createdAt: { gte: notBefore, lte: notAfter },
 },
 select: {
 id: true,
 orderNumber: true,
 email: true,
 items: { select: { name: true, quantity: true, price: true } },
 },
 orderBy: { createdAt: "asc" },
 take: 200,
 });

 let sent = 0;
 for (const order of orders) {
 try {
 const statusUrl = `${SITE.url.replace(/\/$/, "")}/track?order=${order.orderNumber}`;
 await sendPaymentReminder({
 to: order.email,
 orderNumber: order.orderNumber,
 statusUrl,
 items: order.items.map((i) => ({
 name: i.name,
 qty: i.quantity,
 lineTotal: `${i.price * i.quantity}`,
 })),
 });
 await prisma.order.update({ where: { id: order.id }, data: { paymentReminderAt: new Date() } });
 sent += 1;
 } catch (error) {
 logger.error("cron.payment_reminder_failed", {
 orderId: order.id,
 error: error instanceof Error ? error.message : String(error),
 });
 }
 }
 return sent;
}

/** A single daily digest listing everything at or below its low-stock line. */
export async function sendLowStockDigest(): Promise<number> {
 try {
 const products = (
 await prisma.product.findMany({
 where: { status: "ACTIVE", trackInventory: true },
 select: { name: true, sku: true, quantity: true, reservedQuantity: true, lowStockThreshold: true },
 orderBy: { quantity: "asc" },
 take: 500,
 })
 )
 .filter((p) => p.quantity - p.reservedQuantity <= p.lowStockThreshold)
 .slice(0, 50);
 if (products.length === 0) return 0;

 const lines = products.map((p) => {
 const available = Math.max(0, p.quantity - p.reservedQuantity);
 return `- ${p.name}${p.sku ? ` (${p.sku})` : ""}: ${available} left (threshold ${p.lowStockThreshold})`;
 });
 await notifyAdmins({
 type: "SYSTEM",
 event: "ADMIN_LOW_STOCK",
 title: `${products.length} item${products.length === 1 ? "" : "s"} low or out of stock`,
 body: `These gifts need restocking:\n\n${lines.join("\n")}\n\nUpdate stock in the admin inventory page.`,
 });
 return products.length;
 } catch (error) {
 logger.error("cron.low_stock_digest_failed", {
 error: error instanceof Error ? error.message : String(error),
 });
 return 0;
 }
}
