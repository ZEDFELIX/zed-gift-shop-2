import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { giftWrapCreateSchema } from "@/lib/validations";
import { writeAuditLog, requestMeta } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requirePermission("settings.manage");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const wraps = await prisma.giftWrap.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  return NextResponse.json({ wraps });
}

export async function POST(req: Request) {
  let admin;
  try {
    admin = await requirePermission("settings.manage");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  if (d.sku) {
    const clash = await prisma.giftWrap.findUnique({ where: { sku: d.sku } });
    if (clash) return NextResponse.json({ error: "That SKU is already in use." }, { status: 409 });
  }

  const wrap = await prisma.giftWrap.create({
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
    action: "giftwrap.created",
    entity: "GiftWrap",
    entityId: wrap.id,
    after: { name: wrap.name, price: wrap.price },
  });
  return NextResponse.json({ wrap }, { status: 201 });
}
