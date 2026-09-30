import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const patchSchema = z.object({
 label: z.string().max(60).optional().or(z.literal("")),
 county: z.string().min(2).optional(),
 town: z.string().min(2).optional(),
 address: z.string().min(3).optional(),
 building: z.string().max(120).optional().or(z.literal("")),
 apartment: z.string().max(120).optional().or(z.literal("")),
 isDefault: z.coerce.boolean().optional(),
});

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
 const user = await getCurrentUser();
 if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const { id } = await params;
 const existing = await prisma.address.findFirst({ where: { id, userId: user.id } });
 if (!existing) return NextResponse.json({ error: "Address not found." }, { status: 404 });

 let body: unknown;
 try {
 body = await _req.json();
 } catch {
 return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
 }
 const parsed = patchSchema.partial().safeParse(body);
 if (!parsed.success) {
 return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the address." }, { status: 400 });
 }

 const { isDefault, ...fields } = parsed.data;

 const address = await prisma.$transaction(async (tx) => {
 if (isDefault) {
 await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
 }
 return tx.address.update({ where: { id }, data: { ...fields, ...(isDefault !== undefined ? { isDefault } : {}) } });
 });

 return NextResponse.json({ address });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
 const user = await getCurrentUser();
 if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const { id } = await params;
 const existing = await prisma.address.findFirst({ where: { id, userId: user.id } });
 if (!existing) return NextResponse.json({ error: "Address not found." }, { status: 404 });

 await prisma.address.delete({ where: { id } });
 return NextResponse.json({ ok: true });
}