import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { hashPassword } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
 const admin = await getCurrentUser();
 if (!admin || admin.role !== "ADMIN") {
 return NextResponse.json({ error: "Only the owner can add staff." }, { status: 403 });
 }

 let body: unknown;
 try {
 body = await req.json();
 } catch {
 return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
 }
 const parsed = registerSchema.safeParse(body);
 if (!parsed.success) {
 return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the details." }, { status: 400 });
 }

 const email = parsed.data.email.toLowerCase();
 const clash = await prisma.user.findUnique({ where: { email } });
 if (clash) return NextResponse.json({ error: "That email already exists." }, { status: 409 });

 const user = await prisma.user.create({
 data: {
 name: parsed.data.name,
 email,
 passwordHash: await hashPassword(parsed.data.password),
 phone: parsed.data.phone || null,
 role: "STAFF",
 },
 });

 return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } }, { status: 201 });
}