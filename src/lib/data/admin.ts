import "server-only";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * Read models for the admin dashboard and analytics.
 *
 * Queries are deliberately aggregate-first (count/groupBy/aggregate) and always
 * paginated so a large catalogue or order table never loads in full.
 */

export type Range = { from: Date; to: Date };

export function resolveRange(preset: string | undefined, fromStr?: string, toStr?: string): Range & { preset: string } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const presetKey = preset ?? "30d";
  switch (presetKey) {
    case "today":
      return { from: startOfToday, to: end, preset: presetKey };
    case "yesterday": {
      const from = new Date(startOfToday);
      from.setDate(from.getDate() - 1);
      const to = new Date(startOfToday);
      to.setMilliseconds(-1);
      return { from, to, preset: presetKey };
    }
    case "7d": {
      const from = new Date(startOfToday);
      from.setDate(from.getDate() - 6);
      return { from, to: end, preset: presetKey };
    }
    case "3m": {
      const from = new Date(startOfToday);
      from.setMonth(from.getMonth() - 3);
      return { from, to: end, preset: presetKey };
    }
    case "12m": {
      const from = new Date(startOfToday);
      from.setFullYear(from.getFullYear() - 1);
      return { from, to: end, preset: presetKey };
    }
    case "custom": {
      const from = fromStr ? new Date(fromStr) : startOfToday;
      const to = toStr ? new Date(toStr) : end;
      to.setHours(23, 59, 59, 999);
      return { from, to, preset: presetKey };
    }
    case "30d":
    default: {
      const from = new Date(startOfToday);
      from.setDate(from.getDate() - 29);
      return { from, to: end, preset: "30d" };
    }
  }
}

/** Dashboard headline metrics. One call, several cheap aggregates. */
export async function dashboardMetrics() {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const paidWhere: Prisma.OrderWhereInput = { paymentStatus: "SUCCESSFUL" };

  const [
    totalSales,
    todaysSales,
    orderCount,
    pendingOrders,
    customerCount,
    productCount,
    lowStockCount,
    outOfStockCount,
    refundCount,
    pendingReviews,
  ] = await Promise.all([
    prisma.order.aggregate({ where: paidWhere, _sum: { total: true } }),
    prisma.order.aggregate({ where: { ...paidWhere, paidAt: { gte: startOfToday } }, _sum: { total: true } }),
    prisma.order.count(),
    prisma.order.count({ where: { orderStatus: { in: ["PENDING_PAYMENT", "PAID", "PROCESSING", "CUSTOMIZATION", "PACKED"] } } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.product.count(),
    prisma.product.count({ where: { trackInventory: true, status: "ACTIVE", quantity: { gt: 0 } } }),
    prisma.product.count({ where: { trackInventory: true, status: "ACTIVE", quantity: { lte: 0 } } }),
    prisma.refund.count({ where: { status: { in: ["REQUESTED", "PROCESSING"] } } }),
    prisma.review.count({ where: { status: "PENDING" } }),
  ]);

  // Low stock needs a column comparison, which aggregate cannot express.
  const lowStock = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count FROM "Product"
    WHERE "trackInventory" = true AND status = 'ACTIVE' AND quantity <= "lowStockThreshold" AND quantity > 0
  `;

  return {
    totalSales: totalSales._sum.total ?? 0,
    todaysSales: todaysSales._sum.total ?? 0,
    orders: orderCount,
    pendingOrders,
    customers: customerCount,
    products: productCount,
    lowStock: Number(lowStock[0]?.count ?? 0),
    outOfStock: outOfStockCount,
    refunds: refundCount,
    pendingReviews,
  };
}

/** Order counts by status for the overview donut. */
export async function orderStatusBreakdown() {
  const rows = await prisma.order.groupBy({ by: ["orderStatus"], _count: { _all: true } });
  return rows.map((r) => ({ status: r.orderStatus, count: r._count._all }));
}

/** Daily/weekly/monthly/yearly sales series, bucketed in SQL for speed. */
export async function salesSeries(range: Range, bucket: "day" | "week" | "month" | "year" = "day") {
  const trunc = { day: "day", week: "week", month: "month", year: "year" }[bucket];
  const rows = await prisma.$queryRaw<{ bucket: Date; revenue: bigint; orders: bigint }[]>`
    SELECT date_trunc(${trunc}, "paidAt") AS bucket,
           COALESCE(SUM(total), 0)::bigint AS revenue,
           COUNT(*)::bigint AS orders
      FROM "Order"
     WHERE "paymentStatus" = 'SUCCESSFUL' AND "paidAt" >= ${range.from} AND "paidAt" <= ${range.to}
     GROUP BY bucket
     ORDER BY bucket ASC
  `;
  return rows.map((r) => ({
    bucket: r.bucket.toISOString(),
    revenue: Number(r.revenue),
    orders: Number(r.orders),
  }));
}

export async function topProducts(range: Range, limit = 8, direction: "best" | "worst" = "best") {
  // ORDER BY direction cannot be parameterised, so the two variants are separate queries.
  const base = `
      SELECT oi."productId" AS "productId",
             MAX(oi.name) AS name,
             COALESCE(SUM(oi.quantity), 0)::bigint AS units,
             COALESCE(SUM(oi.quantity * oi.price), 0)::bigint AS revenue
        FROM "OrderItem" oi
        JOIN "Order" o ON o.id = oi."orderId"
       WHERE o."paymentStatus" = 'SUCCESSFUL' AND o."paidAt" >= $1 AND o."paidAt" <= $2
         AND oi."productId" IS NOT NULL
       GROUP BY oi."productId"`;

  type Row = { productId: string; name: string; units: bigint; revenue: bigint };
  const rows =
    direction === "best"
      ? await prisma.$queryRawUnsafe<Row[]>(`${base} ORDER BY SUM(oi.quantity) DESC LIMIT $3`, range.from, range.to, limit)
      : await prisma.$queryRawUnsafe<Row[]>(`${base} ORDER BY SUM(oi.quantity) ASC LIMIT $3`, range.from, range.to, limit);

  return rows.map((r) => ({ productId: r.productId, name: r.name, units: Number(r.units), revenue: Number(r.revenue) }));
}

export async function lowStockProducts(limit = 10) {
  // Column-to-column comparison (quantity <= lowStockThreshold) needs SQL.
  return prisma.$queryRaw<
    { id: string; name: string; sku: string | null; quantity: number; reservedQuantity: number; lowStockThreshold: number; slug: string }[]
  >`
    SELECT id, name, sku, quantity, "reservedQuantity", "lowStockThreshold", slug
      FROM "Product"
     WHERE "trackInventory" = true AND status = 'ACTIVE' AND quantity <= "lowStockThreshold"
     ORDER BY quantity ASC
     LIMIT ${limit}
  `;
}

export async function customerAnalytics(range: Range) {
  const [newCustomers, totalCustomers, repeatAgg] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: range.from, lte: range.to } } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.order.groupBy({
      by: ["email"],
      where: { paymentStatus: "SUCCESSFUL", paidAt: { gte: range.from, lte: range.to } },
      _count: { _all: true },
      _sum: { total: true },
    }),
  ]);

  const returning = repeatAgg.filter((r) => r._count._all > 1).length;
  const aov = repeatAgg.length
    ? Math.round(repeatAgg.reduce((sum, r) => sum + (r._sum.total ?? 0), 0) / repeatAgg.reduce((sum, r) => sum + r._count._all, 0))
    : 0;

  return { newCustomers, totalCustomers, returning, aov };
}

export async function inventoryAnalytics() {
  const rows = await prisma.product.findMany({
    where: { trackInventory: true },
    select: { id: true, name: true, quantity: true, reservedQuantity: true },
  });
  // Retail value of stock on hand, using the selling price.
  const stockValue = await prisma.$queryRaw<{ value: bigint }[]>`
    SELECT COALESCE(SUM(quantity * price), 0)::bigint AS value
      FROM "Product" WHERE "trackInventory" = true AND status = 'ACTIVE'
  `.catch(() => [{ value: 0n }]);
  const units = rows.reduce((sum, r) => sum + Math.max(0, r.quantity - r.reservedQuantity), 0);
  return { skusTracked: rows.length, unitsAvailable: units, stockValue: Number(stockValue[0]?.value ?? 0) };
}

/* --------------------------------- lists --------------------------------- */

export async function listCustomersAdmin(input: {
  q?: string;
  status?: string;
  page: number;
  pageSize: number;
}) {
  const where: Prisma.UserWhereInput = {
    role: "CUSTOMER",
    ...(input.status && input.status !== "ALL" ? { status: input.status as never } : {}),
    ...(input.q
      ? {
          OR: [
            { name: { contains: input.q, mode: "insensitive" } },
            { email: { contains: input.q, mode: "insensitive" } },
            { phone: { contains: input.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        orders: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { orderNumber: true, total: true, createdAt: true, paymentStatus: true },
        },
        _count: { select: { orders: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  if (rows.length === 0) return { items: [], total };

  const totals = await prisma.order.groupBy({
    by: ["userId"],
    where: { userId: { in: rows.map((r) => r.id) }, paymentStatus: "SUCCESSFUL" },
    _sum: { total: true },
  });
  const spentByUser = new Map(totals.map((t) => [t.userId, t._sum.total ?? 0]));

  return {
    items: rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      status: r.status,
      createdAt: r.createdAt,
      totalOrders: r._count.orders,
      totalSpent: spentByUser.get(r.id) ?? 0,
      lastOrder: r.orders[0] ?? null,
    })),
    total,
  };
}

export async function getCustomerAdmin(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      role: true,
      createdAt: true,
      lastLoginAt: true,
      addresses: true,
      orders: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, orderNumber: true, total: true, orderStatus: true, paymentStatus: true, createdAt: true },
      },
      reviews: { orderBy: { createdAt: "desc" }, take: 20 },
      wishlist: { include: { items: { take: 50, include: { product: { select: { id: true, name: true, slug: true } } } } } },
      _count: { select: { orders: true } },
    },
  });
  if (!user) return null;

  const spent = await prisma.order.aggregate({
    where: { userId: id, paymentStatus: "SUCCESSFUL" },
    _sum: { total: true },
  });

  return { ...user, totalSpent: spent._sum.total ?? 0 };
}

export async function listPaymentsAdmin(input: {
  q?: string;
  status?: string;
  provider?: string;
  page: number;
  pageSize: number;
}) {
  const where: Prisma.PaymentWhereInput = {
    ...(input.status && input.status !== "ALL" ? { status: input.status as never } : {}),
    ...(input.provider && input.provider !== "ALL" ? { provider: input.provider as never } : {}),
    ...(input.q
      ? {
          OR: [
            { mpesaReceipt: { contains: input.q, mode: "insensitive" } },
            { checkoutRequestId: { contains: input.q, mode: "insensitive" } },
            { transactionId: { contains: input.q, mode: "insensitive" } },
            { txRef: { contains: input.q, mode: "insensitive" } },
            { order: { is: { orderNumber: { contains: input.q, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };

  const [items, total, sums] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
      include: { order: { select: { orderNumber: true, name: true, email: true } } },
    }),
    prisma.payment.count({ where }),
    prisma.payment.groupBy({ by: ["status"], where, orderBy: { status: "asc" }, _sum: { amount: true }, _count: { _all: true } }),
  ]);

  return { items, total, sums };
}

export async function listAuditLogs(input: {
  q?: string;
  action?: string;
  entity?: string;
  page: number;
  pageSize: number;
}) {
  const where: Prisma.AuditLogWhereInput = {
    ...(input.action && input.action !== "ALL" ? { action: { startsWith: input.action } } : {}),
    ...(input.entity && input.entity !== "ALL" ? { entity: input.entity } : {}),
    ...(input.q
      ? {
          OR: [
            { actorEmail: { contains: input.q, mode: "insensitive" } },
            { action: { contains: input.q, mode: "insensitive" } },
            { entityId: { contains: input.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { items, total };
}

export async function listCategoriesAdmin(kind?: string) {
  return prisma.category.findMany({
    where: kind && kind !== "ALL" ? { kind: kind as never } : {},
    include: { _count: { select: { products: true, children: true } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function listInventoryMovements(input: { type?: string; page: number; pageSize: number }) {
  const where: Prisma.InventoryTransactionWhereInput = input.type && input.type !== "ALL" ? { type: input.type as never } : {};
  const [items, total] = await prisma.$transaction([
    prisma.inventoryTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
      include: { product: { select: { id: true, name: true, sku: true } } },
    }),
    prisma.inventoryTransaction.count({ where }),
  ]);
  return { items, total };
}