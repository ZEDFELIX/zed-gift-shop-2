import { NextResponse } from "next/server";
import type { WholesaleQuoteStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const STATUSES = ["NEW", "IN_PROGRESS", "QUOTED", "WON", "CLOSED"] as const;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin = null;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const status = String((body as { status?: unknown }).status ?? "");
  if (!(STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "Unknown status." }, { status: 400 });
  }

  const existing = await prisma.wholesaleQuote.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Quotation not found." }, { status: 404 });

  await prisma.wholesaleQuote.update({
    where: { id },
    data: { status: status as WholesaleQuoteStatus, handledById: admin.id },
  });
  return NextResponse.json({ ok: true });
}
