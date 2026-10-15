import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { verifyOrderToken } from "@/lib/order-token";
import { getSettings } from "@/lib/data/settings";
import { SITE } from "@/lib/constants";
import { buildInvoicePdf, invoiceNumber, type DocBusiness, type DocOrder } from "@/lib/documents";

export const runtime = "nodejs";

async function loadOrder(id: string) {
  return prisma.order.findUnique({
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
}

async function authorize(req: Request, id: string) {
  const order = await loadOrder(id);
  if (!order) return { error: "Order not found.", status: 404 } as const;
  const session = await getSession();
  if (session && (order.userId === session.sub || session.role === "ADMIN" || session.role === "STAFF")) {
    return { order } as const;
  }
  const url = new URL(req.url);
  const token = req.headers.get("x-order-token") ?? url.searchParams.get("token");
  if (verifyOrderToken(token, id)) return { order } as const;
  return { error: "Sign in to download this document.", status: 401 } as const;
}

function business(s: Record<string, unknown>): DocBusiness {
  const str = (v: unknown, fallback: string) => (typeof v === "string" && v.trim() ? v : fallback);
  return {
    name: str(s.storeName, SITE.name),
    phone: str(s.contactPhone, SITE.phone),
    email: str(s.contactEmail, SITE.email),
    address: str(s.address, SITE.address),
    primaryColor: str(s.primaryColor, "#E5397F"),
    secondaryColor: str(s.secondaryColor, "#6B2D5C"),
  };
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authorize(req, id);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const settings = await getSettings();
  const pdf = await buildInvoicePdf(auth.order as DocOrder, business(settings as Record<string, unknown>));
  const filename = `${invoiceNumber(auth.order.orderNumber)}.pdf`;
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
