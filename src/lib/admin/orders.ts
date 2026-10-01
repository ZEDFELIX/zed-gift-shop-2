import "server-only";

import { prisma } from "@/lib/prisma";
import type { OrderStatus, PaymentStatus, Role } from "@prisma/client";
import {
  transitionPayment,
  syncOrderToPaymentStatus,
  isFinal,
} from "@/lib/payments";
import { releaseInventoryForOrder, confirmOrderPaid } from "@/lib/data/orders";
import { writeAuditLog, requestMeta } from "@/lib/audit";

/**
 * Admin-side order mutations.
 *
 * The generic order route used to write `order.paymentStatus` directly, which
 * bypassed the payment state machine, skipped the PaymentEvent trail and left
 * stock un-released on failures. These helpers are the only sanctioned path so
 * an admin correction produces exactly the same side effects as a provider
 * callback.
 */

export const ORDER_STATUS_ORDER: readonly OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAID",
  "PROCESSING",
  "CUSTOMIZATION",
  "PACKED",
  "READY_FOR_DISPATCH",
  "DISPATCHED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export const ADMIN_ORDER_STATUSES: readonly OrderStatus[] = [
  ...ORDER_STATUS_ORDER,
  "CANCELLED",
  "REFUNDED",
];

export type Actor = {
  id: string;
  email: string;
  role: Role | string;
};

export class AdminActionError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "AdminActionError";
  }
}

/** Releases reserved stock exactly once, for terminal non-fulfilled states. */
async function releaseStockIfHeld(orderId: string, orderStatus: OrderStatus, paymentStatus: PaymentStatus) {
  if (isFinal(paymentStatus) && paymentStatus !== "SUCCESSFUL") {
    await releaseInventoryForOrder(orderId);
  } else if (orderStatus === "CANCELLED") {
    await releaseInventoryForOrder(orderId);
  }
}

export async function adminUpdateOrderStatus(input: {
  orderId: string;
  status: string;
  actor: Actor;
  note?: string | null;
}) {
  const { orderId, actor } = input;

  if (!ADMIN_ORDER_STATUSES.includes(input.status as OrderStatus)) {
    throw new AdminActionError("That order status is not recognised.");
  }
  const next = input.status as OrderStatus;

  const before = await prisma.order.findUnique({ where: { id: orderId } });
  if (!before) throw new AdminActionError("Order not found.", 404);

  // Forbid moving a directly-shipped order back to an unpaid state without a
  // payment lifecycle action; order status and payment status must not drift.
  if (next === "PENDING_PAYMENT" && before.paymentStatus === "SUCCESSFUL") {
    throw new AdminActionError("A paid order cannot be returned to awaiting payment.");
  }

  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const data: Record<string, unknown> = { orderStatus: next, updatedAt: now };
    if (next === "CANCELLED") data.cancelledAt = now;

    const order = await tx.order.update({ where: { id: orderId }, data });

    if (next === "CANCELLED") {
      await tx.order.updateMany({
        where: { id: orderId, paymentStatus: { in: ["PENDING", "PROCESSING"] } },
        data: { paymentStatus: "CANCELLED" },
      });
    }

    return order;
  });

  if (next === "CANCELLED") {
    await releaseStockIfHeld(orderId, next, updated.paymentStatus);
  }

  const meta = await requestMeta();
  await writeAuditLog({
    ...meta,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: "order.status_changed",
    entity: "Order",
    entityId: orderId,
    orderId,
    before: { orderStatus: before.orderStatus, paymentStatus: before.paymentStatus },
    after: { orderStatus: updated.orderStatus, paymentStatus: updated.paymentStatus },
  });

  return updated;
}

/**
 * Manual payment decision (e.g. reconciling a bank transfer, or confirming an
 * M-Pesa receipt an admin verified out-of-band).
 */
export async function adminSetPaymentStatus(input: {
  orderId: string;
  status: string;
  actor: Actor;
  note?: string | null;
  mpesaReceipt?: string | null;
}) {
  const { orderId, actor } = input;
  const next = input.status as PaymentStatus;
  const allowed: PaymentStatus[] = ["PENDING", "PROCESSING", "SUCCESSFUL", "FAILED", "CANCELLED", "TIMEOUT", "REFUNDED"];
  if (!allowed.includes(next)) throw new AdminActionError("That payment status is not recognised.");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!order) throw new AdminActionError("Order not found.", 404);

  const latest = order.payments[0];

  // SUCCESSFUL is the one transition that must move real stock, so it goes
  // through confirmOrderPaid which owns that side effect.
  if (next === "SUCCESSFUL") {
    let paymentId = latest?.id;
    if (!paymentId) {
      const created = await prisma.payment.create({
        data: {
          orderId,
          provider: "M_PESA",
          status: "PENDING",
          amount: order.total,
          currency: "KES",
          phone: order.phone,
        },
      });
      paymentId = created.id;
    }
    const receipt = input.mpesaReceipt?.trim() || latest?.mpesaReceipt || `MANUAL-${order.orderNumber}`;
    if (isFinal(latest?.status ?? "PENDING") && latest?.status !== "SUCCESSFUL") {
      throw new AdminActionError("A failed or cancelled payment cannot be marked successful. Start a new payment instead.");
    }
    await confirmOrderPaid(orderId, paymentId, receipt);
    const meta = await requestMeta();
    await writeAuditLog({
      ...meta,
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: "payment.manually_confirmed",
      entity: "Order",
      entityId: orderId,
      orderId,
      before: { paymentStatus: order.paymentStatus },
      after: { paymentStatus: "SUCCESSFUL", receipt },
    });
    return prisma.order.findUnique({ where: { id: orderId } });
  }

  // Every other status must be a legal transition so replayed/duplicate admin
  // actions are absorbed rather than corrupting the ledger.
  if (!latest) {
    throw new AdminActionError("This order has no payment to update.");
  }
  const ok = await transitionPayment({
    paymentId: latest.id,
    to: next,
    source: "admin",
    note: input.note ?? null,
    metadata: { actorId: actor.id, actorEmail: actor.email },
  });
  if (!ok) {
    throw new AdminActionError("That payment status change is not allowed from the current state.");
  }

  await syncOrderToPaymentStatus(orderId, next);
  await releaseStockIfHeld(orderId, order.orderStatus, next);

  const meta = await requestMeta();
  await writeAuditLog({
    ...meta,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: "payment.status_changed",
    entity: "Order",
    entityId: orderId,
    orderId,
    before: { paymentStatus: order.paymentStatus },
    after: { paymentStatus: next },
  });

  return prisma.order.findUnique({ where: { id: orderId } });
}