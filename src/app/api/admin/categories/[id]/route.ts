import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission, fail } from "@/lib/api";
import { writeAuditLog, requestMeta } from "@/lib/audit";

export const runtime = "nodejs";

const patchSchema = z.object({
 name: z.string().min(2).max(120).optional(),
 description: z.string().max(2000).nullable().optional(),
 image: z.string().max(500).nullable().optional(),
 kind: z.enum(["CATEGORY", "OCCASION", "RECIPIENT"]).optional(),
 parentId: z.string().max(40).nullable().optional(),
 sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
 active: z.coerce.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
 let actor;
 try {
 actor = await requirePermission("categories.manage");
 } catch {
 return fail("You do not have permission to manage categories.", 403);
 }

 const { id } = await params;
 const before = await prisma.category.findUnique({ where: { id } });
 if (!before) return fail("Category not found.", 404);

 let body: unknown;
 try {
 body = await req.json();
 } catch {
 return fail("Invalid request body.", 400);
 }
 const parsed = patchSchema.safeParse(body);
 if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Please check the fields.", 400);

 if (parsed.data.parentId && parsed.data.parentId === id) {
 return fail("A category cannot be its own parent.", 400);
 }

 const category = await prisma.category.update({
   where: { id },
   data: {
     ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
     ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
     ...(parsed.data.image !== undefined ? { image: parsed.data.image } : {}),
     ...(parsed.data.kind !== undefined ? { kind: parsed.data.kind } : {}),
     ...(parsed.data.parentId !== undefined ? { parentId: parsed.data.parentId } : {}),
     ...(parsed.data.sortOrder !== undefined ? { sortOrder: parsed.data.sortOrder } : {}),
     ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}),
   },
 });

 const meta = await requestMeta();
 await writeAuditLog({
   ...meta,
   actorId: actor.id,
   actorEmail: actor.email,
   actorRole: actor.role,
   action: "category.updated",
   entity: "Category",
   entityId: id,
   before,
   after: category,
 });

 return NextResponse.json({ data: category });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
 let actor;
 try {
 actor = await requirePermission("categories.manage");
 } catch {
 return fail("You do not have permission to manage categories.", 403);
 }

 const { id } = await params;
 const before = await prisma.category.findUnique({ where: { id }, include: { _count: { select: { products: true, children: true } } } });
 if (!before) return fail("Category not found.", 404);

 // Refuse to hard-delete a category that is still referenced; archive instead.
 if (before._count.products > 0 || before._count.children > 0) {
   const archived = await prisma.category.update({ where: { id }, data: { active: false } });
   const meta = await requestMeta();
   await writeAuditLog({
     ...meta,
     actorId: actor.id,
     actorEmail: actor.email,
     actorRole: actor.role,
     action: "category.archived",
     entity: "Category",
     entityId: id,
     before: { active: before.active },
     after: { active: archived.active },
   });
   return NextResponse.json({ data: archived, meta: { archived: true } });
 }

 await prisma.category.delete({ where: { id } });
 const meta = await requestMeta();
 await writeAuditLog({
   ...meta,
   actorId: actor.id,
   actorEmail: actor.email,
   actorRole: actor.role,
   action: "category.deleted",
   entity: "Category",
   entityId: id,
   before,
 });

 return NextResponse.json({ data: { ok: true } });
}
