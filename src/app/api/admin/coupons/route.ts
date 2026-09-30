import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { discountCreateSchema } from "@/lib/validations";

export const runtime = "nodejs";

async function guard() {
 try {
 return await requireAdmin();
 } catch {
 return null;
 }
}

export async function GET() {
 const admin = await guard();
 if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
 return NextResponse.json({ coupons });
}

export async function POST(req: Request) {
 const admin = await guard();
 if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 let body: unknown;
 try {
 body = await req.json();
 } catch {
 return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
 }
 const parsed = discountCreateSchema.safeParse(body);
 if (!parsed.success) {
 return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the coupon." }, { status: 400 });
 }
 const d = parsed.data;

 const clash = await prisma.coupon.findUnique({ where: { code: d.code } });
 if (clash) return NextResponse.json({ error: "That coupon code already exists." }, { status: 409 });

 const coupon = await prisma.coupon.create({
 data: {
 code: d.code,
 type: d.type,
 value: d.value,
 scope: d.scope,
 scopeId: d.scopeId || null,
 minSpend: d.minSpend,
 maxUses: d.maxUses ?? null,
 expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
 active: d.active,
 },
 });

 return NextResponse.json({ coupon }, { status: 201 });
}