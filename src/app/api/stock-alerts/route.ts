import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { emailSchema } from "@/lib/validations";

export const runtime = "nodejs";

const schema = z.object({
 productId: z.string().min(1),
 variantId: z.string().min(1).nullable().optional(),
 email: emailSchema,
});

function clientIp(req: Request): string {
 const forwarded = req.headers.get("x-forwarded-for");
 if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
 return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Register a "notify me when back in stock" request. */
export async function POST(req: Request) {
 const rl = await rateLimit(`stock-alert:${clientIp(req)}`, { limit: 10, windowSeconds: 3600 });
 if (!rl.ok) {
 return NextResponse.json(
 { error: `Too many requests. Please try again in ${rl.retryAfterSeconds}s.` },
 { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
 );
 }

 let body: unknown;
 try {
 body = await req.json();
 } catch {
 return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
 }
 const parsed = schema.safeParse(body);
 if (!parsed.success) {
 return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check your email address." }, { status: 400 });
 }

 const email = parsed.data.email.trim().toLowerCase();
 const variantId = parsed.data.variantId ?? null;

 const product = await prisma.product.findUnique({
 where: { id: parsed.data.productId },
 select: { id: true, status: true },
 });
 if (!product || product.status === "ARCHIVED") {
 return NextResponse.json({ error: "That gift is no longer available." }, { status: 404 });
 }

 if (variantId) {
 const variant = await prisma.productVariant.findUnique({ where: { id: variantId }, select: { productId: true } });
 if (!variant || variant.productId !== product.id) {
 return NextResponse.json({ error: "That option is no longer available." }, { status: 404 });
 }
 }

 const existing = await prisma.stockAlert.findFirst({
 where: { productId: product.id, variantId, email, notifiedAt: null },
 select: { id: true },
 });
 if (!existing) {
 await prisma.stockAlert.create({ data: { productId: product.id, variantId, email } });
 }

 return NextResponse.json({ ok: true });
}
