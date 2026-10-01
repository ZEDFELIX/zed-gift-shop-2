import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission, fail } from "@/lib/api";
import { transitionPayment, syncOrderToPaymentStatus } from "@/lib/payments";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const patchSchema = z.object({
  status: z.enum(["PROCESSING", "SUCCEEDED", "FAILED", "REJECTED"]),
  note: z.string().trim().max(500).optional(),
  providerRefundId: z.string().trim().max(120).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
 let actor;
 try {
 actor = await requirePermission("refunds.manage");
 } catch {
 return fail("You do not have permission to manage refunds.", 403);
 }

 const { id } = await params;
 const refund = await prisma.refund.findUnique({
   where: { id },
   include: { order: { select: { id: true, orderNumber: true, userId: true, email: true, name: true } }, payment: true },
 });
 if (!refund) return fail("Refund not found.", 404);
 if (refund.status === "SUCCEEDED") return fail("This refund has already been completed.", 409);

 let body: unknown;
 try {
 body = await req.json();
 } catch {
 return fail("Invalid request body.", 400);
 }
 const parsed = patchSchema.safeParse(body);
 if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Please check the fields.", 400);

 try {
   const isDone = parsed.data.status === "SUCCEEDED";

   if (isDone) {
     const moved = await transitionPayment({
       paymentId: refund.paymentId,
       to: "REFUNDED",
       source: "admin-refund",
       note: parsed.data.note ?? `Refund ${refund.id} completed`,
     });
     if (!moved) return fail("The payment could not be marked as refunded; its status is already final.", 409);
     await syncOrderToPaymentStatus(refund.orderId, "REFUNDED");
   }

   const updated = await prisma.refund.update({
     where: { id },
     data: {
       status: parsed.data.status,
       ...(parsed.data.providerRefundId ? { providerRefundId: parsed.data.providerRefundId } : {}),
       ...(parsed.data.note ? { providerMessage: parsed.data.note } : {}),
       ...(isDone ? { processedAt: new Date() } : {}),
       ...(parsed.data.status === "FAILED" ? { failureReason: parsed.data.note ?? "Marked failed by admin." } : {}),
     },
   });

   const meta = await requestMeta();
   await writeAuditLog({
     ...meta,
     actorId: actor.id,
     actorEmail: actor.email,
     actorRole: actor.role,
     action: `refund.${parsed.data.status.toLowerCase()}`,
     entity: "Refund",
     entityId: id,
     orderId: refund.orderId,
     before: { status: refund.status },
     after: { status: updated.status, note: parsed.data.note ?? null },
   });

   if (isDone && refund.order.userId) {
     await notify({
       userId: refund.order.userId,
       type: "ORDER",
       event: "REFUND_PROCESSED",
       title: `Refund processed for ${refund.order.orderNumber}`,
       body: `A refund of KES ${refund.amount.toLocaleString("en-KE")} has been processed. It may take a few business days to reflect.`,
       toEmail: refund.order.email,
     }).catch(() => undefined);
   }

   return NextResponse.json({ data: updated });
 } catch (error) {
   logger.error("admin.refunds.update_failed", { id, error: error instanceof Error ? error.message : String(error) });
   return fail("Could not update the refund.", 500);
 }
}
