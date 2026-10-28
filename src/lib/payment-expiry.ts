import "server-only";

import { prisma } from "@/lib/prisma";
import { confirmOrderPaid, releaseInventoryForOrder } from "@/lib/data/orders";
import { amountSatisfies, syncOrderToPaymentStatus, transitionPayment } from "@/lib/payments";
import { queryStkStatus } from "@/lib/mpesa";
import { sendOrderConfirmation } from "@/lib/email";
import { SITE } from "@/lib/constants";

const PAYMENT_CHECK_GRACE_MS = 60 * 1000;

function samePhone(a: string, b: string): boolean {
  const normalize = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits.startsWith("254") ? `0${digits.slice(3)}` : digits;
  };
  return normalize(a) === normalize(b);
}

async function deferExpiry(paymentId: string, now: Date): Promise<void> {
  await prisma.payment.update({
    where: { id: paymentId },
    data: { expiredAt: new Date(now.getTime() + PAYMENT_CHECK_GRACE_MS) },
  });
}

/**
 * Expires stale payment attempts only while their order is still awaiting
 * payment. For M-PESA, first query Daraja so an unreceived callback cannot
 * cause a successful payment to be cancelled and its stock released.
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
    select: {
      id: true,
      orderId: true,
      provider: true,
      status: true,
      checkoutRequestId: true,
      phone: true,
      amount: true,
    },
  });

  if (!payment) return false;

  if (payment.provider === "M_PESA") {
    if (!payment.checkoutRequestId) {
      await deferExpiry(payment.id, now);
      return false;
    }

    const result = await queryStkStatus({
      checkoutRequestId: payment.checkoutRequestId,
      phone: payment.phone ?? undefined,
    });

    // A transport/API failure is not evidence that the customer failed to pay.
    if (result.error || !result.resultCode) {
      await deferExpiry(payment.id, now);
      return false;
    }

    if (result.ok && result.resultCode === "0") {
      // Do not release stock for a successful charge if Daraja has not yet
      // returned all fields needed to safely reconcile it.
      if (
        !result.mpesaReceipt ||
        !amountSatisfies(payment.amount, result.amount) ||
        (result.phone && payment.phone && !samePhone(result.phone, payment.phone))
      ) {
        await deferExpiry(payment.id, now);
        return false;
      }

      const applied = await transitionPayment({
        paymentId: payment.id,
        to: "SUCCESSFUL",
        source: "payment-expiry-reconciliation",
        note: "Payment reconciled directly with Daraja after callback delay.",
        metadata: {
          amount: result.amount,
          mpesaReceipt: result.mpesaReceipt,
          phone: result.phone,
        },
        patch: {
          mpesaReceipt: result.mpesaReceipt,
          resultCode: 0,
          resultDescription: result.resultDescription ?? "Confirmed by Daraja status query.",
          transactionDate: result.transactionDate ?? null,
          completedAt: now,
        },
      });

      if (applied) {
        await confirmOrderPaid(payment.orderId, payment.id, result.mpesaReceipt);
        await syncOrderToPaymentStatus(payment.orderId, "SUCCESSFUL");
        const order = await prisma.order.findUnique({
          where: { id: payment.orderId },
          include: { items: true },
        });
        if (order) {
          await sendOrderConfirmation({
            to: order.email,
            orderNumber: order.orderNumber,
            total: `KES ${order.total.toLocaleString("en-KE")}`,
            items: order.items.map((item) => ({
              name: item.name,
              qty: item.quantity,
              lineTotal: `KES ${(item.price * item.quantity + item.giftWrapPrice * item.quantity).toLocaleString("en-KE")}`,
            })),
            statusUrl: `${SITE.url}/track?order=${order.orderNumber}`,
          });
        }
      }
      return false;
    }

    // Daraja returned a definitive non-zero result (cancelled, timed out, or
    // rejected). Only then is it safe to release the reservation.
    const resultCode = result.resultCode;
    const terminalStatus = resultCode === "1037" ? "TIMEOUT" : resultCode === "1032" ? "CANCELLED" : "FAILED";
    const applied = await transitionPayment({
      paymentId: payment.id,
      to: terminalStatus,
      source: "payment-expiry-reconciliation",
      note: result.resultDescription ?? `Daraja confirmed payment result ${resultCode}.`,
      metadata: { resultCode },
      patch: {
        resultCode: Number(resultCode) || null,
        resultDescription: result.resultDescription ?? "Payment was not completed.",
      },
    });
    if (!applied) return false;
    await syncOrderToPaymentStatus(payment.orderId, terminalStatus);
    await releaseInventoryForOrder(payment.orderId);
    return true;
  }

  // COD and bank-transfer orders have no live provider status to query; their
  // configured expiry is the point at which the unpaid reservation is released.
  const applied = await transitionPayment({
    paymentId: payment.id,
    to: "TIMEOUT",
    source: "payment-expiry",
    note: "Payment window expired without settlement.",
    patch: { resultDescription: "Payment window expired without settlement." },
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
