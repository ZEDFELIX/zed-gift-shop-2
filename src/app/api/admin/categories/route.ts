import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission, parseBody, fail, HttpError } from "@/lib/api";
import { listCategories } from "@/lib/data/catalog";
import { categoryCreateSchema } from "@/lib/validations";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    await requirePermission("categories.manage");
  } catch {
    return fail("You do not have permission to view categories.", 403);
  }
  const url = new URL(req.url);
  const kindParam = url.searchParams.get("kind");
  const kind = kindParam === "CATEGORY" || kindParam === "OCCASION" || kindParam === "RECIPIENT" ? kindParam : undefined;
  const categories = await listCategories(kind);
  return NextResponse.json({ data: categories });
}

export async function POST(req: Request) {
  let actor;
  try {
    actor = await requirePermission("categories.manage");
  } catch {
    return fail("You do not have permission to manage categories.", 403);
  }

  let body: z.infer<typeof categoryCreateSchema>;
  try {
    body = await parseBody(req, categoryCreateSchema);
  } catch (error) {
    if (error instanceof HttpError) return fail(error.message, error.status);
    return fail("Invalid request body.", 400);
  }

  try {
    const existing = await prisma.category.findUnique({ where: { slug: body.slug } });
    if (existing) return fail("A category with that slug already exists.", 409);

    const category = await prisma.category.create({
      data: {
        name: body.name,
        slug: body.slug,
        kind: body.kind,
        description: body.description ?? null,
        image: body.image ?? null,
        parentId: body.parentId ?? null,
        sortOrder: body.sortOrder ?? 0,
        active: body.active ?? true,
      },
    });

    const meta = await requestMeta();
    await writeAuditLog({
      ...meta,
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: "category.created",
      entity: "Category",
      entityId: category.id,
      after: category,
    });

    return NextResponse.json({ data: category }, { status: 201 });
  } catch (error) {
    logger.error("admin.categories.create_failed", { error: error instanceof Error ? error.message : String(error) });
    return fail("Could not create the category.", 500);
  }
}
