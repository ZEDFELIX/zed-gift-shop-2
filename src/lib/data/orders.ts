import "server-only";

import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";
import { ORDER_STATUS_STEPS as STEP_DEFS } from "@/lib/constants";
import type { DeliveryMethod, OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { resolveFeeForMethod, type DeliveryZone } from "@/lib/data/delivery";

export type CreateOrderInput = {
 userId?: string | null;
 name: string;
 email: string;
 phone: string;
county: string;
  town: string;
  area?: string | null;
  street?: string | null;
  address: string;
  building?: string | null;
  apartment?: string | null;
  landmark?: string | null;
  deliveryInstructions?: string | null;
  deliveryMethod: DeliveryMethod;
 items: {
 productId: string | null;
 variantId: string | null;
 name: string;
 sku: string | null;
 image: string | null;
 price: number;
 quantity: number;
 giftWrapPrice: number;
 personalizationJson: string | null;
 giftWrapJson: string | null;
 giftMessageJson: string | null;
 }[];
 subtotal: number;
 discount: number;
 couponCode: string | null;
 couponId: string | null;
 isGift: boolean;
};

export async function createOrder(input: CreateOrderInput): Promise<{ orderId: string; orderNumber: string }> {
  const netTotal = Math.max(0, input.subtotal - input.discount);
  const { fee: deliveryFee, estimatedDeliveryDate, zone } = await resolveDeliveryFee({
    county: input.county,
    town: input.town,
    method: input.deliveryMethod,
    subtotal: netTotal,
  });
  const total = netTotal + deliveryFee;

  const order = await prisma.order.create({
  data: {
  orderNumber: generateOrderNumber(),
  userId: input.userId ?? null,
  name: input.name,
  email: input.email,
  phone: input.phone,
  subtotal: input.subtotal,
  discount: input.discount,
  deliveryFee,
  total,
  couponCode: input.couponCode,
  couponId: input.couponId,
  deliveryMethod: input.deliveryMethod,
  county: input.county,
  town: input.town,
  area: input.area ?? null,
  street: input.street ?? null,
  address: input.address,
  building: input.building ?? null,
  apartment: input.apartment ?? null,
  landmark: input.landmark ?? null,
  deliveryInstructions: input.deliveryInstructions ?? null,
  deliveryPartner: zone?.deliveryPartner ?? null,
  expectedDeliveryDate: estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : null,
 orderStatus: "PENDING_PAYMENT",
 paymentStatus: "PENDING",
 isGift: input.isGift,
 items: {
 create: input.items.map((item) => ({
 productId: item.productId,
 variantId: item.variantId,
 name: item.name,
 sku: item.sku,
 image: item.image,
 price: item.price,
 quantity: item.quantity,
 giftWrapPrice: item.giftWrapPrice,
 personalizationJson: item.personalizationJson,
 giftWrapJson: item.giftWrapJson,
 giftMessageJson: item.giftMessageJson,
 })),
 },
 },
 });

 return { orderId: order.id, orderNumber: order.orderNumber };
}

async function resolveDeliveryFee(input: {
  county: string;
  town: string;
  method: DeliveryMethod;
  subtotal: number;
}): Promise<{ fee: number; estimatedDeliveryDate: string | null; zone: DeliveryZone | null }> {
  if (input.method === "PICKUP") return { fee: 0, estimatedDeliveryDate: null, zone: null };
  return resolveFeeForMethod(input);
}

export async function getOrderByNumberAndKey(orderNumber: string, key: string) {
  const order = await prisma.order.findUnique({
    where: { orderNumber: orderNumber.toUpperCase() },
    include: { items: true, payments: { orderBy: { createdAt: "desc" } } },
  });
  if (!order) return null;

  if (key.includes("@")) {
    const match = order.email.toLowerCase() === key.trim().toLowerCase();
    return match ? order : null;
  }

  // Phone lookups must present a substantial part of the number. Matching on a
  // short suffix let anyone enumerate orders by guessing three digits.
  const provided = key.replace(/\D/g, "");
  const stored = order.phone.replace(/\D/g, "");
  if (provided.length < 9 || !stored.endsWith(provided)) return null;

  return order;
}

export async function getOrdersByEmailOrPhone(value: string) {
 const lower = value.trim().toLowerCase();
 return prisma.order.findMany({
 where: { OR: [{ email: lower }, { phone: { contains: lower } }] },
 include: { items: true },
 orderBy: { createdAt: "desc" },
 take: 50,
 });
}

export async function getOrdersForUser(userId: string) {
 return prisma.order.findMany({
 where: { userId },
 include: { items: true, payments: { orderBy: { createdAt: "desc" } } },
 orderBy: { createdAt: "desc" },
 });
}

export async function listOrdersAdmin(opts: {
 q?: string;
 status?: string;
 payment?: string;
 page?: number;
 pageSize?: number;
}) {
 const page = Math.max(1, opts.page ?? 1);
 const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 25));
 const where: Prisma.OrderWhereInput = {};
 if (opts.status) where.orderStatus = opts.status as OrderStatus;
 if (opts.payment && opts.payment !== "ALL") where.paymentStatus = opts.payment as PaymentStatus;
 if (opts.q) {
 where.OR = [
 { orderNumber: { contains: opts.q, mode: "insensitive" } },
 { name: { contains: opts.q, mode: "insensitive" } },
 { email: { contains: opts.q, mode: "insensitive" } },
 { phone: { contains: opts.q, mode: "insensitive" } },
 ];
 }
 const [items, total] = await Promise.all([
 prisma.order.findMany({
 where,
 include: { items: true, payments: { orderBy: { createdAt: "desc" }, take: 1 } },
 orderBy: { createdAt: "desc" },
 skip: (page - 1) * pageSize,
 take: pageSize,
 }),
 prisma.order.count({ where }),
 ]);
 return { items, total, page, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getOrderById(id: string) {
 return prisma.order.findUnique({
 where: { id },
 include: { items: true, payments: { orderBy: { createdAt: "desc" } } },
 });
}

export async function getOrderByNumber(orderNumber: string) {
 return prisma.order.findUnique({
 where: { orderNumber: orderNumber.toUpperCase() },
 include: { items: true, payments: { orderBy: { createdAt: "desc" } }, user: true },
 });
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
 return prisma.order.update({ where: { id: orderId }, data: { orderStatus: status } });
}

export async function updatePaymentStatus(orderId: string, status: PaymentStatus) {
 const now = new Date();
 await prisma.order.update({
 where: { id: orderId },
 data: {
 paymentStatus: status,
 orderStatus: status === "SUCCESSFUL" ? "PAID" : undefined,
 updatedAt: now,
 },
 });
}

export async function reserveInventoryForOrder(orderId: string) {
 const order = await getOrderById(orderId);
 if (!order) return;

 const captures: { productId: string | null; variantId: string | null; quantity: number }[] = order.items.map((i) => ({
 productId: i.productId,
 variantId: i.variantId,
 quantity: i.quantity,
 }));

 for (const c of captures) {
 if (c.productId) {
 await prisma.product.update({
 where: { id: c.productId },
 data: { reservedQuantity: { increment: c.quantity } },
 });
 }
 if (c.variantId) {
 await prisma.productVariant.update({
 where: { id: c.variantId },
 data: { reservedQuantity: { increment: c.quantity } },
 });
 }
 await prisma.inventoryTransaction.create({
 data: {
 productId: c.productId,
 variantId: c.variantId,
 type: "RESERVE",
 quantity: c.quantity,
 note: `Order ${order.orderNumber}`,
 refOrderItemId: order.id,
 },
 });
 }
}

export async function releaseInventoryForOrder(orderId: string) {
 const order = await getOrderById(orderId);
 if (!order) return;
 for (const item of order.items) {
 if (item.productId) {
 const product = await prisma.product.findUnique({ where: { id: item.productId } });
 if (product) {
 await prisma.product.update({
 where: { id: item.productId },
 data: { reservedQuantity: { decrement: Math.min(item.quantity, product.reservedQuantity) } },
 });
 }
 }
 if (item.variantId) {
 const variant = await prisma.productVariant.findUnique({ where: { id: item.variantId } });
 if (variant) {
 await prisma.productVariant.update({
 where: { id: item.variantId },
 data: { reservedQuantity: { decrement: Math.min(item.quantity, variant.reservedQuantity) } },
 });
 }
 }
 await prisma.inventoryTransaction.create({
 data: {
 productId: item.productId,
 variantId: item.variantId,
 type: "RELEASE",
 quantity: -item.quantity,
 note: `Order ${order.orderNumber} ${order.paymentStatus === "SUCCESSFUL" ? "paid" : "cancelled"}`,
 },
 });
 }
}

export async function confirmOrderPaid(orderId: string, paymentId: string, mpesaReceipt: string) {
 const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
 if (!order || order.paymentStatus === "SUCCESSFUL") return;

 const now = new Date();
 await prisma.$transaction(async (tx) => {
 await tx.order.update({
 where: { id: orderId },
 data: { paymentStatus: "SUCCESSFUL", orderStatus: "PAID", updatedAt: now },
 });
// Stock deduction: committed sale, release reserves and decrement real stock.
  for (const item of order.items) {
  if (item.productId) {
  const product = await tx.product.findUnique({ where: { id: item.productId } });
  if (product) {
  const release = Math.min(item.quantity, product.reservedQuantity);
  await tx.product.update({
  where: { id: item.productId },
  data: {
  reservedQuantity: { decrement: release },
  quantity: { decrement: item.quantity },
  },
  });
  }
  }
  if (item.variantId) {
  const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
  if (variant) {
  const release = Math.min(item.quantity, variant.reservedQuantity);
  await tx.productVariant.update({
  where: { id: item.variantId },
  data: {
  reservedQuantity: { decrement: release },
  quantity: { decrement: item.quantity },
  },
  });
  }
  }
 await tx.inventoryTransaction.create({
 data: {
 productId: item.productId,
 variantId: item.variantId,
 type: "OUT",
 quantity: -item.quantity,
 note: `Order ${order.orderNumber} (${mpesaReceipt})`,
 },
 });
 }

 if (order.couponId) {
 await tx.coupon.update({ where: { id: order.couponId }, data: { usedCount: { increment: 1 } } });
 }
 });

 await prisma.payment.update({
 where: { id: paymentId },
 data: { mpesaReceipt, updatedAt: now },
 });
}

export const ORDER_STATUS_STEPS = STEP_DEFS as { status: OrderStatus; label: string }[];

export function orderTimelineStart(status: OrderStatus): number {
 const index = ORDER_STATUS_STEPS.findIndex((s) => s.status === status);
 return index < 0 ? 0 : index;
}