import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendOrderStatusUpdate } from "@/lib/email";
import { SITE, ORDER_STATUS_STEPS } from "@/lib/constants";
import { z } from "zod";
import {
  adminUpdateOrderStatus,
  adminSetPaymentStatus,
  AdminActionError,
} from "@/lib/admin/orders";
import { writeAuditLog, requestMeta } from "@/lib/audit";

const schema = z
  .object({
    orderStatus: z.string().optional(),
    paymentStatus: z.string().optional(),
    mpesaReceipt: z.string().trim().max(64).optional(),
    note: z.string().trim().max(500).optional(),
  })
  .refine((v) => v.orderStatus || v.paymentStatus, {
    message: "Provide an orderStatus and/or paymentStatus to change.",
  });

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  let actor;
  try {
    actor = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await params;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the fields." }, { status: 400 });
  }

  try {
    // Payment status is never written directly: it goes through the payment
    // state machine so PaymentEvent history and stock stay consistent.
    if (parsed.data.paymentStatus) {
      await adminSetPaymentStatus({
        orderId,
        status: parsed.data.paymentStatus,
        actor,
        note: parsed.data.note ?? null,
        mpesaReceipt: parsed.data.mpesaReceipt ?? null,
      });
    }

    if (parsed.data.orderStatus) {
      await adminUpdateOrderStatus({
        orderId,
        status: parsed.data.orderStatus,
        actor,
        note: parsed.data.note ?? null,
      });
    }

    if (parsed.data.mpesaReceipt) {
      const meta = await requestMeta();
      await prisma.payment.updateMany({
        where: { orderId },
        data: { mpesaReceipt: parsed.data.mpesaReceipt },
      });
      await writeAuditLog({
        ...meta,
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: "payment.receipt_recorded",
        entity: "Order",
        entityId: orderId,
        orderId,
        after: { mpesaReceipt: parsed.data.mpesaReceipt },
      });
    }
  } catch (error) {
    if (error instanceof AdminActionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[admin/orders] update failed", error);
    return NextResponse.json({ error: "We couldn't update this order." }, { status: 500 });
  }

  const updated = await prisma.order.findUnique({ where: { id: orderId } });
  if (!updated) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  // Notify the customer when the status moves forward.
  const steppedStatuses = ORDER_STATUS_STEPS.map((s) => s.status);
  const oldIndex = steppedStatuses.indexOf(order.orderStatus);
  const newIndex = steppedStatuses.indexOf(updated.orderStatus);
  if (newIndex > oldIndex) {
    await sendOrderStatusUpdate({
      to: updated.email,
      orderNumber: updated.orderNumber,
      status: ORDER_STATUS_STEPS[newIndex]?.label ?? updated.orderStatus,
      statusUrl: `${SITE.url}/track?order=${updated.orderNumber}`,
    }).catch((error) => console.error("[admin/orders] status email failed", error));
  }

  return NextResponse.json({ order: updated });
}