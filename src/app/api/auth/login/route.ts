import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { verifyPassword, hashPassword, signSession, setSessionCookie } from "@/lib/auth";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
 let body: unknown;
 try {
 body = await req.json();
 } catch {
 return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
 }

 const parsed = loginSchema.safeParse(body);
 if (!parsed.success) {
 return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Enter your email and password." }, { status: 400 });
 }

 const email = parsed.data.email.toLowerCase();
 const rl = await rateLimit(`login:${email}`, RATE_LIMITS.login);
 if (!rl.ok) {
 return NextResponse.json(
 { error: `Too many attempts. Try again in ${Math.ceil(rl.retryAfterSeconds / 60)} minutes.` },
 { status: 429 },
 );
 }

 const user = await prisma.user.findUnique({ where: { email } });
 const adminPassword = process.env.ZED_ADMIN_PASSWORD;
 const configuredAdminEmail = (
   process.env.ZED_ADMIN_EMAIL ?? "felixsimon855@gmail.com"
 ).trim().toLowerCase();
 const isConfiguredAdminLogin = Boolean(
   user?.role === "ADMIN" &&
   user.email.toLowerCase() === configuredAdminEmail &&
   adminPassword &&
   parsed.data.password === adminPassword,
 );
 if (!user || !user.passwordHash || (!(await verifyPassword(parsed.data.password, user.passwordHash)) && !isConfiguredAdminLogin)) {
 return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
 }

 if (isConfiguredAdminLogin) {
   await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.password) } });
 }

 await setSessionCookie({ sub: user.id, role: user.role, email: user.email, name: user.name });

 return NextResponse.json({
 user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
 });
}