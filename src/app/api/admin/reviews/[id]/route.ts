import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recalcProductRating } from "@/lib/data/reviews";
import { z } from "zod";

const schema = z.object({ status: z.enum(["APPROVED", "REJECTED"]) });

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
 try {
 await requireAdmin();
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

 return NextResponse.json({ ok: true });
}