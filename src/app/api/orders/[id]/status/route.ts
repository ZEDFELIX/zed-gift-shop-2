import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOrderToken } from "@/lib/order-token";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

function clientKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return ip;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const limit = await rateLimit(`order-status:${clientKey(req)}`, { limit: 120, windowSeconds: 60 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  // Guest checkout callers present the token issued at order creation. Admins
  // and the order owner are also allowed through.
  const token = req.headers.get("x-order-token") ?? new URL(req.url).searchParams.get("token");
  if (!verifyOrderToken(token, id)) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
    orderNumber: true,
    orderStatus: true,
    paymentStatus: true,
    total: true,
    payments: { select: { mpesaReceipt: true, status: true, resultDescription: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    total: order.total,
    mpesaReceipt: order.payments[0]?.mpesaReceipt ?? null,
    paymentResultDescription: order.payments[0]?.resultDescription ?? null,
  });
}