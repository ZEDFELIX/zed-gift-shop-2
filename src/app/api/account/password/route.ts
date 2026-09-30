import { NextResponse } from "next/server";
import { getCurrentUser, verifyPassword, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { passwordSchema } from "@/lib/validations";
import { z } from "zod";

const schema = z.object({
 currentPassword: z.string().min(1, "Enter your current password"),
 newPassword: passwordSchema,
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

 const parsed = schema.safeParse(body);
 if (!parsed.success) {
 return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the fields." }, { status: 400 });
 }

 const current = await prisma.user.findUnique({ where: { id: user.id } });
 if (!current?.passwordHash || !(await verifyPassword(parsed.data.currentPassword, current.passwordHash))) {
 return NextResponse.json({ error: "Your current password is incorrect." }, { status: 400 });
 }

 await prisma.user.update({
 where: { id: user.id },
 data: { passwordHash: await hashPassword(parsed.data.newPassword) },
 });

 return NextResponse.json({ ok: true });
}