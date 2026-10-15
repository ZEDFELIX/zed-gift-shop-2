import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { verifyOrderToken } from "@/lib/order-token";
import { getSettings } from "@/lib/data/settings";
import { SITE } from "@/lib/constants";
import {
  amountPaid,
  buildReceiptPdf,
  receiptNumber,
  type DocBusiness,
  type DocOrder,
} from "@/lib/documents";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      orderNumber: true,
      userId: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      building: true,
      apartment: true,
      town: true,
      county: true,
      subtotal: true,
      discount: true,
      deliveryFee: true,
      total: true,
      couponCode: true,
      orderStatus: true,
      paymentStatus: true,
      createdAt: true,
      items: { select: { name: true, sku: true, price: true, quantity: true, giftWrapPrice: true } },
      payments: {
        select: {
          provider: true,
          status: true,
          amount: true,
          mpesaReceipt: true,
          transactionCode: true,
          txRef: true,
          bankReference: true,
          completedAt: true,
          transactionDate: true,
        },
      },
    },
  });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const session = await getSession();
  const allowed =
    (session && (order.userId === session.sub || session.role === "ADMIN" || session.role === "STAFF")) ||
    verifyOrderToken(
      req.headers.get("x-order-token") ?? new URL(req.url).searchParams.get("token"),
      id,
    );
  if (!allowed) return NextResponse.json({ error: "Sign in to download this document." }, { status: 401 });

  // Receipts are only ever issued for verified payments - never for pending orders.
  if (order.paymentStatus !== "SUCCESSFUL" || amountPaid(order as DocOrder) <= 0) {
    return NextResponse.json({ error: "No verified payment yet - the receipt appears once payment confirms." }, { status: 409 });
  }

  const settings = (await getSettings()) as Record<string, unknown>;
  const str = (v: unknown, fallback: string) => (typeof v === "string" && v.trim() ? v : fallback);
  const biz: DocBusiness = {
    name: str(settings.storeName, SITE.name),
    phone: str(settings.contactPhone, SITE.phone),
    email: str(settings.contactEmail, SITE.email),
    address: str(settings.address, SITE.address),
    primaryColor: str(settings.primaryColor, "#E5397F"),
    secondaryColor: str(settings.secondaryColor, "#6B2D5C"),
  };
  const pdf = await buildReceiptPdf(order as DocOrder, biz);
  const filename = `${receiptNumber(order.orderNumber)}.pdf`;
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
