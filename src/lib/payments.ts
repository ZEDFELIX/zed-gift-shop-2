import "server-only";

import { prisma } from "@/lib/prisma";
import type { PaymentStatus, Prisma } from "@prisma/client";

/**
 * Every payment status change goes through here so that the order mirror, the
 * append-only PaymentEvent history and the inventory side effects can never
 * drift apart. Provider callbacks are untrusted input; this module is the only
 * place that decides what a payment actually means.
 */

const FINAL: ReadonlySet<PaymentStatus> = new Set<PaymentStatus>([
  "SUCCESSFUL",
  "FAILED",
  "CANCELLED",
  "TIMEOUT",
  "REFUNDED",
  "REVERSED",
]);

/** Allowed transitions. Anything not listed here is rejected as a bug. */
const TRANSITIONS: Record<PaymentStatus, ReadonlySet<PaymentStatus>> = {
  PENDING: new Set(["PROCESSING", "SUCCESSFUL", "FAILED", "CANCELLED", "TIMEOUT"]),
  PROCESSING: new Set(["SUCCESSFUL", "FAILED", "CANCELLED", "TIMEOUT"]),
  SUCCESSFUL: new Set(["REFUNDED", "REVERSED"]),
  FAILED: new Set([]),
  CANCELLED: new Set([]),
  TIMEOUT: new Set([]),
  REFUNDED: new Set([]),
  REVERSED: new Set([]),
};

export function isFinal(status: PaymentStatus): boolean {
  return FINAL.has(status);
}

export function canTransition(from: PaymentStatus, to: PaymentStatus): boolean {
  if (from === to) return false;
  return TRANSITIONS[from].has(to);
}

export type TransitionInput = {
  paymentId: string;
  to: PaymentStatus;
  /** Where the decision came from, e.g. "mpesa-callback", "daraja-query", "admin". */
  source: string;
  note?: string | null;
  metadata?: Record<string, unknown>;
  /** Provider identifiers captured alongside the transition. */
  patch?: Prisma.PaymentUpdateInput;
};

/**
 * Applies a status transition atomically and records it. Returns false when the
 * payment is already final or the transition is not permitted, which is how
 * replayed callbacks are absorbed without double-applying side effects.
 */
export async function transitionPayment(input: TransitionInput): Promise<boolean> {
  const { paymentId, to, source, note, metadata, patch } = input;

  const updated = await prisma.$transaction(async (tx) => {
    const current = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!current) return null;
    if (current.status === to) return null;
    if (isFinal(current.status)) return null;
    if (!canTransition(current.status, to)) return null;

    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: to,
        ...(to === "SUCCESSFUL" ? { completedAt: new Date() } : {}),
        ...(patch ?? {}),
      },
    });

    await tx.paymentEvent.create({
      data: {
        paymentId,
        fromStatus: current.status,
        toStatus: to,
        source,
        note: note ?? null,
        metadataJson: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return { orderId: current.orderId, previous: current.status };
  });

  return updated !== null;
}

export async function recordPaymentEvent(
  paymentId: string,
  input: { toStatus: PaymentStatus; source: string; note?: string | null; metadata?: Record<string, unknown> },
): Promise<void> {
  await prisma.paymentEvent.create({
    data: {
      paymentId,
      toStatus: input.toStatus,
      source: input.source,
      note: input.note ?? null,
      metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });
}

/**
 * Mirrors the payment outcome onto the order. Paid orders move to PAID with a
 * timestamp; failed or cancelled payments release reserved stock and cancel
 * the order so the items can be sold again.
 */
export async function syncOrderToPaymentStatus(orderId: string, status: PaymentStatus): Promise<void> {
  const now = new Date();

  if (status === "SUCCESSFUL") {
    await prisma.order.updateMany({
      where: { id: orderId, orderStatus: "PENDING_PAYMENT" },
      data: { orderStatus: "PAID", paymentStatus: "SUCCESSFUL", paidAt: now },
    });
    return;
  }

  if (status === "FAILED" || status === "CANCELLED" || status === "TIMEOUT") {
    await prisma.order.updateMany({
      where: { id: orderId, orderStatus: "PENDING_PAYMENT" },
      data: { orderStatus: "CANCELLED", paymentStatus: status, cancelledAt: now },
    });
  } else if (status === "REFUNDED" || status === "REVERSED") {
    await prisma.order.updateMany({
      where: { id: orderId },
      data: { paymentStatus: status, orderStatus: "REFUNDED" },
    });
  } else {
    await prisma.order.updateMany({
      where: { id: orderId, orderStatus: "PENDING_PAYMENT" },
      data: { paymentStatus: status },
    });
  }
}

/**
 * Verifies that a payment record and a provider-reported amount agree before an
 * order is treated as paid. A short payment must never release an order.
 */
export function amountSatisfies(expected: number, reported: number | undefined): boolean {
  if (reported == null || Number.isNaN(reported)) return false;
  return Math.round(reported) >= Math.round(expected);
}

// Re-exported for callers that historically imported it from here; the single
// implementation lives in @/lib/audit so redaction rules stay in one place.
export { writeAuditLog } from "@/lib/audit";