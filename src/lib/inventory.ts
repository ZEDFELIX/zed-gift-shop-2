import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Inventory is reserved at checkout and only converted to a real stock
 * decrement once payment is verified.
 *
 * Every movement here is a *guarded conditional update*: the WHERE clause
 * carries the availability predicate, so the database itself refuses the write
 * when stock ran out. That removes the check-then-act race that let concurrent
 * checkouts oversell, and it means a caller cannot accidentally write a
 * negative quantity or over-reserve.
 */

export class OutOfStockError extends Error {
  readonly code = "OUT_OF_STOCK";
  constructor(
    readonly productId: string,
    readonly requested: number,
    readonly available: number,
  ) {
    super(`Insufficient stock for product ${productId}: requested ${requested}, available ${available}.`);
    this.name = "OutOfStockError";
  }
}

type Tx = Prisma.TransactionClient | typeof prisma;

type Capture = { productId: string | null; variantId: string | null; quantity: number };

/**
 * Moves `reservedQuantity` up by `quantity`, but only while enough stock remains.
 *
 * Returns false when the guard rejected the write so the caller can roll back
 * and report the shortfall, rather than silently overselling.
 */
async function guardedReserve(tx: Tx, capture: Capture): Promise<boolean> {
  const n = capture.quantity;

  if (capture.productId) {
    const rows = await tx.$queryRaw<{ id: string }[]>`
      UPDATE "Product"
         SET "reservedQuantity" = "reservedQuantity" + ${n}
       WHERE id = ${capture.productId}
         AND "trackInventory" = false
      RETURNING id
    `;
    if (rows.length === 0) {
      const rows2 = await tx.$queryRaw<{ id: string }[]>`
        UPDATE "Product"
           SET "reservedQuantity" = "reservedQuantity" + ${n}
         WHERE id = ${capture.productId}
           AND "trackInventory" = true
           AND "quantity" - "reservedQuantity" >= ${n}
        RETURNING id
      `;
      if (rows2.length === 0) return false;
    }
  }

  // A variant carries its own stock columns (no trackInventory flag); when a
  // variant exists its numbers are authoritative for the reservation.
  if (capture.variantId) {
    const rows = await tx.$queryRaw<{ id: string }[]>`
      UPDATE "ProductVariant"
         SET "reservedQuantity" = "reservedQuantity" + ${n}
       WHERE id = ${capture.variantId}
         AND "quantity" - "reservedQuantity" >= ${n}
      RETURNING id
    `;
    if (rows.length === 0) return false;
  }

  return true;
}

/** Unwinds a reservation. Always clamped, so it can never go negative. */
async function guardedRelease(tx: Tx, capture: Capture): Promise<void> {
  const n = capture.quantity;

  if (capture.productId) {
    await tx.$executeRaw`
      UPDATE "Product"
         SET "reservedQuantity" = GREATEST(0, "reservedQuantity" - ${n})
       WHERE id = ${capture.productId}
    `;
  }
  if (capture.variantId) {
    await tx.$executeRaw`
      UPDATE "ProductVariant"
         SET "reservedQuantity" = GREATEST(0, "reservedQuantity" - ${n})
       WHERE id = ${capture.variantId}
    `;
  }
}

async function ledger(
  tx: Tx,
  capture: Capture,
  type: "RESERVE" | "RELEASE" | "OUT" | "IN",
  quantity: number,
  note: string,
): Promise<void> {
  await tx.inventoryTransaction.create({
    data: {
      productId: capture.productId,
      variantId: capture.variantId,
      type,
      quantity,
      note,
    },
  });
}

/**
 * Reserves stock for an order inside an existing transaction.
 *
 * Throws OutOfStockError on the first shortfall; because the caller owns the
 * transaction, the throw unwinds every reservation made so far.
 */
export async function reserveWithinTx(
  tx: Tx,
  captures: Capture[],
  note: string,
): Promise<void> {
  const done: Capture[] = [];
  try {
    for (const capture of captures) {
      const ok = await guardedReserve(tx, capture);
      if (!ok) throw new OutOfStockError(capture.productId ?? capture.variantId ?? "unknown", capture.quantity, 0);
      done.push(capture);
      await ledger(tx, capture, "RESERVE", capture.quantity, note);
    }
  } catch (error) {
    // Unwind the partial reservation so nothing leaks.
    for (const capture of done) {
      await guardedRelease(tx, capture).catch(() => undefined);
    }
    throw error;
  }
}

/** Releases a reservation inside an existing transaction. Never throws. */
export async function releaseWithinTx(tx: Tx, captures: Capture[], note: string): Promise<void> {
  for (const capture of captures) {
    await guardedRelease(tx, capture);
    await ledger(tx, capture, "RELEASE", -capture.quantity, note);
  }
}

/**
 * Converts a reservation into a committed sale: releases the hold and
 * decrements real stock, guarded so quantity can never fall below zero.
 */
export async function commitSaleWithinTx(
  tx: Tx,
  captures: Capture[],
  note: string,
): Promise<void> {
  for (const capture of captures) {
    const n = capture.quantity;

    if (capture.productId) {
      await tx.$executeRaw`
        UPDATE "Product"
           SET "reservedQuantity" = GREATEST(0, "reservedQuantity" - ${n}),
               "quantity"         = GREATEST(0, "quantity" - ${n})
         WHERE id = ${capture.productId}
      `;
    }
    if (capture.variantId) {
      await tx.$executeRaw`
        UPDATE "ProductVariant"
           SET "reservedQuantity" = GREATEST(0, "reservedQuantity" - ${n}),
               "quantity"         = GREATEST(0, "quantity" - ${n})
         WHERE id = ${capture.variantId}
      `;
    }

    await ledger(tx, capture, "OUT", -n, note);
  }
}

/** Reads current availability so error messages can state the real shortfall. */
export async function availabilityFor(
  productId: string,
  variantId: string | null,
): Promise<number> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { quantity: true, reservedQuantity: true, trackInventory: true },
  });
  if (!product) return 0;
  if (!variantId) {
    return product.trackInventory ? product.quantity - product.reservedQuantity : Number.POSITIVE_INFINITY;
  }

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { quantity: true, reservedQuantity: true },
  });
  if (!variant) return 0;
  return variant.quantity - variant.reservedQuantity;
}

/**
 * Returns the names of products that crossed their low-stock threshold.
 * Used to raise admin alerts after a sale.
 */
export async function lowStockAlerts(
  productIds: string[],
): Promise<{ productId: string; name: string; remaining: number }[]> {
  if (productIds.length === 0) return [];
  const rows = await prisma.product.findMany({
    where: { id: { in: productIds }, trackInventory: true },
    select: { id: true, name: true, quantity: true, reservedQuantity: true, lowStockThreshold: true },
  });
  return rows
    .filter((r) => r.quantity - r.reservedQuantity <= r.lowStockThreshold)
    .map((r) => ({ productId: r.id, name: r.name, remaining: r.quantity - r.reservedQuantity }));
}