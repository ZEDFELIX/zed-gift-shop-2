import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function guard() {
 try {
 return await requireAdmin();
 } catch {
 return null;
 }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
 const admin = await guard();
 if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const { id } = await params;
 const existing = await prisma.coupon.findUnique({ where: { id } });
 if (!existing) return NextResponse.json({ error: "Coupon not found." }, { status: 404 });

 let body: unknown;
 try {
 body = await req.json();
 } catch {
 return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
 }
 const { active } = (body ?? {}) as { active?: boolean };
 if (typeof active !== "boolean") {
 return NextResponse.json({ error: "Missing active flag." }, { status: 400 });
 }

 const coupon = await prisma.coupon.update({ where: { id }, data: { active } });
 return NextResponse.json({ coupon });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
 const admin = await guard();
 if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const { id } = await params;
 await prisma.coupon.delete({ where: { id } });
 return NextResponse.json({ ok: true });
}