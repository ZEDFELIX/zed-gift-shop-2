import { NextResponse } from "next/server";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { adjustStock } from "@/lib/data/inventory";
import { z } from "zod";

const schema = z.object({
 productId: z.string().min(1),
 variantId: z.string().optional().or(z.literal("")),
 delta: z.number().int().min(-100000).max(100000),
 note: z.string().max(300).optional().or(z.literal("")),
});

export const runtime = "nodejs";

export async function POST(req: Request) {
 try {
 await requireAdmin();
 } catch {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const admin = await getCurrentUser();
 let body: unknown;
 try {
 body = await req.json();
 } catch {
 return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
 }
 const parsed = schema.safeParse(body);
 if (!parsed.success) {
 return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the adjustment." }, { status: 400 });
 }

 await adjustStock({
 productId: parsed.data.productId,
 variantId: parsed.data.variantId || null,
 type: parsed.data.delta >= 0 ? "IN" : "OUT",
 quantity: Math.abs(parsed.data.delta),
 note: parsed.data.note || "Manual admin adjustment",
 userId: admin?.id ?? null,
 });

 return NextResponse.json({ ok: true });
}