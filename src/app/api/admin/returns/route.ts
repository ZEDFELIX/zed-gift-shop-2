import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { writeAuditLog, requestMeta } from "@/lib/audit";

export const runtime = "nodejs";

const STATUSES = ["REQUESTED", "APPROVED", "REJECTED", "COMPLETED"] as const;

export async function GET() {
  try {
    await requirePermission("orders.manage");
  } catch {
    return NextResponse.json({ error: "You do not have permission to view returns." }, { status: 403 });
  }

  const items = await prisma.returnRequest.findMany({
    include: {
      order: { select: { orderNumber: true, email: true, name: true, phone: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ items });
}

const patchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(STATUSES),
});

export async function PATCH(req: Request) {
  let actor;
  try {
    actor = await requirePermission("orders.manage");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the status." }, { status: 400 });
  }

  const existing = await prisma.returnRequest.findUnique({ where: { id: parsed.data.id } });
  if (!existing) return NextResponse.json({ error: "Return request not found." }, { status: 404 });

  const item = await prisma.returnRequest.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status },
  });

  const meta = await requestMeta();
  await writeAuditLog({
    ...meta,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: "return.status_changed",
    entity: "ReturnRequest",
    entityId: item.id,
    orderId: item.orderId,
    before: { status: existing.status },
    after: { status: item.status },
  });

  return NextResponse.json({ item });
}
