import "server-only";

import { prisma } from "@/lib/prisma";

export async function adjustStock(input: {
 productId: string;
 variantId?: string | null;
 type: "IN" | "OUT" | "ADJUST";
 quantity: number;
 note?: string | null;
 userId?: string | null;
}) {
 return prisma.$transaction(async (tx) => {
 const delta = input.type === "OUT" ? -Math.abs(input.quantity) : input.quantity;

 let product = null;
 if (input.productId) {
 product = await tx.product.findUnique({ where: { id: input.productId } });
 if (!product) throw new Error("Product not found.");
 const next = Math.max(0, product.quantity + delta);
 await tx.product.update({ where: { id: input.productId }, data: { quantity: next } });
 }

 let variant = null;
 if (input.variantId) {
 variant = await tx.productVariant.findUnique({ where: { id: input.variantId } });
 if (!variant) throw new Error("Variant not found.");
 const next = Math.max(0, variant.quantity + delta);
 await tx.productVariant.update({ where: { id: input.variantId }, data: { quantity: next } });
 }

 const txn = await tx.inventoryTransaction.create({
 data: {
 productId: input.productId,
 variantId: input.variantId,
 userId: input.userId,
 type: input.type,
 quantity: delta,
 note: input.note,
 },
 });

 return { txnId: txn.id, productQuantity: product?.quantity ?? 0, variantQuantity: variant?.quantity ?? 0 };
 });
}

export async function listTransactions(input: { productId?: string; take?: number; cursor?: string }) {
 return prisma.inventoryTransaction.findMany({
 where: { productId: input.productId },
 include: { product: { select: { name: true, sku: true } }, variant: { select: { value: true } }, user: { select: { name: true } } },
 orderBy: { createdAt: "desc" },
 take: input.take ?? 50,
 ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
 });
}

export function lowStockProducts(threshold = 5) {
 return prisma.product.findMany({
 where: { status: "ACTIVE", trackInventory: true, quantity: { lte: threshold } },
 select: { id: true, slug: true, name: true, sku: true, quantity: true, reservedQuantity: true, lowStockThreshold: true },
 orderBy: { quantity: "asc" },
 take: 100,
 });
}