import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emailSchema } from "@/lib/validations";
import { z } from "zod";

export const runtime = "nodejs";

const profileSchema = z.object({
 name: z.string().min(2).max(120).optional(),
 phone: z.string().min(9).max(20).optional(),
 email: emailSchema.optional(),
});

export async function PATCH(req: Request) {
 const user = await getCurrentUser();
 if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 let body: unknown;
 try {
 body = await req.json();
 } catch {
 return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
 }

 const parsed = profileSchema.safeParse(body);
 if (!parsed.success) {
 return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check your details." }, { status: 400 });
 }

 const data: { name?: string; phone?: string; email?: string } = {};
 if (parsed.data.name) data.name = parsed.data.name;
 if (parsed.data.phone) data.phone = parsed.data.phone;
 if (parsed.data.email && parsed.data.email.toLowerCase() !== user.email) {
 const clash = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
 if (clash) {
 return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
 }
 data.email = parsed.data.email.toLowerCase();
 }

 const updated = await prisma.user.update({
 where: { id: user.id },
 data,
 select: { id: true, name: true, email: true, phone: true, role: true },
 });

 return NextResponse.json({ user: updated });
}