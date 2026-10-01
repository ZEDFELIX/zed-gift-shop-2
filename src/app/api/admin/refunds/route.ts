import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission, parsePagination, pageMeta, parseBody, fail, HttpError } from "@/lib/api";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { notifyAdmins } from "@/lib/notifications";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET(req: Request) {
 try {
 await requirePermission("refunds.manage");
 } catch {
 return fail("You do not have permission to view refunds.", 403);
 }

 const url = new URL(req.url);
 const { page, pageSize } = parsePagination(url, { pageSize: 25 });
 const status = url.searchParams.get("status");
 const where = status && status !== "ALL" ? { status: status as never } : {};

 const [items, total] = await prisma.$transaction([
   prisma.refund.findMany({
     where,
     orderBy: { createdAt: "desc" },
     skip: (page - 1) * pageSize,
     take: pageSize,
     include: { order: { select: { orderNumber: true, name: true, email: true, total: true } }, payment: { select: { provider: true, mpesaReceipt: true } } },
   }),
   prisma.refund.count({ where }),
 ]);

 return NextResponse.json({ data: items, meta: pageMeta(page, pageSize, total) });
}

const createSchema = z.object({
  orderId: z.string().min(1).max(64),
  amount: z.coerce.number().int().min(1).max(10_000_000).optional(),
  reason: z.string().trim().min(3).max(500),
});

export async function POST(req: Request) {
 let actor;
 try {
 actor = await requirePermission("refunds.manage");
 } catch {
 return fail("You do not have permission to manage refunds.", 403);
 }

 let body: z.infer<typeof createSchema>;
 try {
 body = await parseBody(req, createSchema);
 } catch (error) {
 if (error instanceof HttpError) return fail(error.message, error.status);
 return fail("Invalid request body.", 400);
 }

 const order = await prisma.order.findUnique({
   where: { id: body.orderId },
   include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
 });
 if (!order) return fail("Order not found.", 404);

 const payment = order.payments[0];
 if (!payment) return fail("This order has no successful payment to refund.", 400);
 if (payment.status !== "SUCCESSFUL") return fail("Refunds are only possible for a successful payment.", 400);

 const amount = body.amount ?? order.total;

 try {
   const refund = await prisma.refund.create({
     data: {
       orderId: order.id,
       paymentId: payment.id,
       amount,
       reason: body.reason,
       status: "REQUESTED",
       requestedById: actor.id,
       requestedByEmail: actor.email,
     },
   });

   const meta = await requestMeta();
   await writeAuditLog({
     ...meta,
     actorId: actor.id,
     actorEmail: actor.email,
     actorRole: actor.role,
     action: "refund.requested",
     entity: "Refund",
     entityId: refund.id,
     orderId: order.id,
     after: { amount, reason: body.reason },
   });

   await notifyAdmins({
     event: "ADMIN_NEW_REFUND_REQUEST",
     title: `Refund requested for ${order.orderNumber}`,
     body: `${actor.email} requested a refund of KES ${amount.toLocaleString("en-KE")}: ${body.reason}`,
   }).catch(() => undefined);

   return NextResponse.json({ data: refund }, { status: 201 });
 } catch (error) {
   logger.error("admin.refunds.create_failed", { error: error instanceof Error ? error.message : String(error) });
   return fail("Could not create the refund.", 500);
 }
}
