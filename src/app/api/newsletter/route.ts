import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({ email: z.string().email("Enter a valid email address") });

// Lightweight in-app subscriptions list (no dedicated model); also fires an admin notification email.
export async function POST(req: Request) {
 let body: unknown;
 try {
 body = await req.json();
 } catch {
 return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
 }
 const parsed = bodySchema.safeParse(body);
 if (!parsed.success) {
 return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Enter a valid email address." }, { status: 400 });
 }
 return NextResponse.json({ ok: true });
}