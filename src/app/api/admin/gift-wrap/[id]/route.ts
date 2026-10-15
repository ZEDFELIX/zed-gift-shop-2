import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { giftWrapCreateSchema } from "@/lib/validations";
import { writeAuditLog, requestMeta } from "@/lib/audit";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.giftWrap.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Gift wrap not found." }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const parsed = giftWrapCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the form." }, { status: 400 });
  }
  const d = parsed.data;
  if (d.sku && d.sku !== existing.sku) {
    const clash = await prisma.giftWrap.findUnique({ where: { sku: d.sku } });
    if (clash) return NextResponse.json({ error: "That SKU is already in use." }, { status: 409 });
  }

  const wrap = await prisma.giftWrap.update({
    where: { id },
    data: {
      name: d.name.trim(),
      sku: d.sku?.trim() || null,
      price: d.price,
      image: d.image?.trim() || null,
      description: d.description?.trim() || null,
      active: d.active ?? true,
      sortOrder: d.sortOrder ?? 0,
    },
  });

  const meta = await requestMeta();
  await writeAuditLog({
    ...meta,
    actorId: admin.id,
    actorEmail: admin.email,
    actorRole: admin.role,
    action: "giftwrap.updated",
    entity: "GiftWrap",
    entityId: id,
    after: { name: wrap.name, price: wrap.price },
  });
  return NextResponse.json({ wrap });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.giftWrap.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Gift wrap not found." }, { status: 404 });

  await prisma.giftWrap.delete({ where: { id } });

  const meta = await requestMeta();
  await writeAuditLog({
    ...meta,
    actorId: admin.id,
    actorEmail: admin.email,
    actorRole: admin.role,
    action: "giftwrap.deleted",
    entity: "GiftWrap",
    entityId: id,
    before: { name: existing.name },
  });
  return NextResponse.json({ ok: true });
}
