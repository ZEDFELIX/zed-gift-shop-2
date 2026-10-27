import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { escapeCsv } from "@/lib/csv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = ["orderNumber", "createdAt", "customerName", "totalKES", "paymentStatus", "orderStatus", "paymentProvider", "paymentReceipt", "deliveryMethod", "county", "town"];

export async function GET() {
  try {
    await requirePermission("orders.manage");
  } catch {
    return NextResponse.json({ error: "You do not have permission to export orders." }, { status: 403 });
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  const lines = [HEADERS.join(",")];
  for (const order of orders) {
    const payment = order.payments[0];
    const values = [
      order.orderNumber, order.createdAt.toISOString(), order.name, order.total,
      order.paymentStatus, order.orderStatus, payment?.provider ?? "",
      payment?.mpesaReceipt ?? "", order.deliveryMethod, order.county, order.town,
    ];
    lines.push(values.map(escapeCsv).join(","));
  }
  const csv = "\uFEFF" + lines.join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="zed-orders.csv"',
      "Cache-Control": "no-store",
    },
  });
}
