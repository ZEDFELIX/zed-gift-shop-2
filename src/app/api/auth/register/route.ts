import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { hashPassword, signSession, setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
 let body: unknown;
 try {
 body = await req.json();
 } catch {
 return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
 }

 const parsed = registerSchema.safeParse(body);
 if (!parsed.success) {
 return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check your details." }, { status: 400 });
 }

 const existing = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
 if (existing) {
 return NextResponse.json({ error: "An account with that email already exists. Try logging in instead." }, { status: 409 });
 }

 const user = await prisma.user.create({
 data: {
 name: parsed.data.name,
 email: parsed.data.email.toLowerCase(),
 passwordHash: await hashPassword(parsed.data.password),
 phone: parsed.data.phone || null,
 role: "CUSTOMER",
 },
 });

 await setSessionCookie({ sub: user.id, role: "CUSTOMER", email: user.email, name: user.name });

 return NextResponse.json({
 user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
 });
}