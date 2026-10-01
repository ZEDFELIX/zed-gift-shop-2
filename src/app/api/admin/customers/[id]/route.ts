import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission, parseBody, fail, HttpError } from "@/lib/api";
import { getCustomerAdmin } from "@/lib/data/admin";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("customers.view");
  } catch {
    return fail("You do not have permission to view customers.", 403);
  }

  const { id } = await params;
  const customer = await getCustomerAdmin(id);
  if (!customer) return fail("Customer not found.", 404);
  return NextResponse.json({ data: customer });
}

const patchSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "DISABLED"]).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().max(20).nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let actor;
  try {
    actor = await requirePermission("customers.manage");
  } catch {
    return fail("You do not have permission to change customers.", 403);
  }

  const { id } = await params;

  let body: z.infer<typeof patchSchema>;
  try {
    body = await parseBody(req, patchSchema);
  } catch (error) {
    if (error instanceof HttpError) return fail(error.message, error.status);
    return fail("Invalid request body.", 400);
  }

  const before = await prisma.user.findUnique({ where: { id }, select: { status: true, name: true, phone: true } });
  if (!before) return fail("Customer not found.", 404);

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(body.name ? { name: body.name } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
      },
      select: { id: true, name: true, email: true, phone: true, status: true },
    });

    const meta = await requestMeta();
    await writeAuditLog({
      ...meta,
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: "customer.updated",
      entity: "User",
      entityId: id,
      before,
      after: { status: updated.status, name: updated.name, phone: updated.phone },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    logger.error("admin.customers.update_failed", { id, error: error instanceof Error ? error.message : String(error) });
    return fail("Could not update the customer.", 500);
  }
}
