import "server-only";

import { prisma } from "@/lib/prisma";
import { releaseInventoryForOrder } from "@/lib/data/orders";
import { syncOrderToPaymentStatus, transitionPayment } from "@/lib/payments";

/**
 * Expires stale payment attempts only while their order is still awaiting
 * payment. A guarded status transition ensures concurrent polls/cron runs do
 * not release the same reservation twice.
 */
export async function expireOrderPaymentIfDue(orderId: string, now = new Date()): Promise<boolean> {
  const payment = await prisma.payment.findFirst({
    where: {
      orderId,
      status: { in: ["PENDING", "PROCESSING"] },
      expiredAt: { lte: now },
      order: { is: { orderStatus: "PENDING_PAYMENT" } },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, orderId: true, status: true },
  });

  if (!payment) return false;

  const applied = await transitionPayment({
    paymentId: payment.id,
    to: "TIMEOUT",
    source: "payment-expiry",
    note: "Payment attempt expired without provider confirmation.",
    patch: { resultDescription: "Payment attempt expired without provider confirmation." },
  });

  if (!applied) return false;

  await syncOrderToPaymentStatus(payment.orderId, "TIMEOUT");
  await releaseInventoryForOrder(payment.orderId);
  return true;
}

/** Batch cleanup used by the scheduled maintenance job. */
export async function expireStalePayments(now = new Date()): Promise<number> {
  const stale = await prisma.payment.findMany({
    where: {
      status: { in: ["PENDING", "PROCESSING"] },
      expiredAt: { lte: now },
      order: { is: { orderStatus: "PENDING_PAYMENT" } },
    },
    select: { orderId: true },
    distinct: ["orderId"],
    take: 500,
  });

  let expired = 0;
  for (const { orderId } of stale) {
    try {
      if (await expireOrderPaymentIfDue(orderId, now)) expired += 1;
    } catch (error) {
      console.error("[payment-expiry] failed to expire order", {
        orderId,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
  return expired;
}
