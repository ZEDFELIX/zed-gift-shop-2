import { NextResponse } from "next/server";
import { requireAdmin, getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recalcProductRating } from "@/lib/data/reviews";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({ status: z.enum(["APPROVED", "REJECTED"]) });

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const review = await prisma.review.findUnique({ where: { id }, include: { product: true } });
  if (!review) return NextResponse.json({ error: "Review not found." }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  await prisma.review.update({ where: { id }, data: { status: parsed.data.status } });
  await recalcProductRating(review.productId);

  // Approving (or rejecting) a moderated review clears any open reports on it.
  await prisma.reviewReport.updateMany({ where: { reviewId: id, resolved: false }, data: { resolved: true } });

  await writeAuditLog({
    actorId: admin.id,
    actorEmail: admin.email,
    action: `review.${parsed.data.status === "APPROVED" ? "approved" : "rejected"}`,
    entity: "review",
    entityId: id,
  }).catch(() => undefined);

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const review = await prisma.review.findUnique({ where: { id }, select: { id: true, productId: true } });
  if (!review) return NextResponse.json({ error: "Review not found." }, { status: 404 });

  await prisma.review.delete({ where: { id } });
  await recalcProductRating(review.productId);

  await writeAuditLog({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "review.deleted",
    entity: "review",
    entityId: id,
  }).catch(() => undefined);

  return NextResponse.json({ ok: true });
}