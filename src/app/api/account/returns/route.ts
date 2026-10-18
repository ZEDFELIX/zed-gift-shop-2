import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyAdmins } from "@/lib/notifications";

export const runtime = "nodejs";

const schema = z.object({
  orderId: z.string().min(1),
  reason: z.string().min(3).max(120),
  details: z.string().max(1000).optional(),
});

// Matches the store's published return policy: 7 days from delivery.
const RETURN_WINDOW_DAYS = 7;

/** Customer self-service return/exchange request. */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the request." }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { id: parsed.data.orderId, userId: session.sub },
    select: { id: true, orderStatus: true, orderNumber: true, updatedAt: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  if (order.orderStatus !== "DELIVERED") {
    return NextResponse.json({ error: "Only delivered orders can be returned or exchanged." }, { status: 400 });
  }

  // The status change to DELIVERED bumps updatedAt, so it is the closest
  // available proxy for the delivery timestamp.
  const windowEnd = new Date(order.updatedAt.getTime() + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  if (Date.now() > windowEnd.getTime()) {
    return NextResponse.json({ error: "The return window for this order has closed." }, { status: 400 });
  }

  const existing = await prisma.returnRequest.findFirst({ where: { orderId: order.id }, select: { id: true } });
  if (existing) {
    return NextResponse.json({ error: "A return has already been requested for this order." }, { status: 400 });
  }

  const request = await prisma.returnRequest.create({
    data: { orderId: order.id, userId: session.sub, reason: parsed.data.reason, details: parsed.data.details || null },
  });

  await notifyAdmins({
    type: "SYSTEM",
    event: "ADMIN_NEW_REFUND_REQUEST",
    title: `Return requested for order ${order.orderNumber}`,
    body: `A customer requested a return or exchange.\n\nOrder: ${order.orderNumber}\nReason: ${parsed.data.reason}${parsed.data.details ? `\n\nDetails: ${parsed.data.details}` : ""}\n\nReview it in the admin Returns page.`,
  }).catch(() => undefined);

  return NextResponse.json({ id: request.id, ok: true }, { status: 201 });
}
