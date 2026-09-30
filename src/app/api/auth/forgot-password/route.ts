import { NextResponse } from "next/server";
import { z } from "zod";
import { emailSchema } from "@/lib/validations";
import { createPasswordResetToken } from "@/lib/auth";
import { sendPasswordReset } from "@/lib/email";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { SITE } from "@/lib/constants";

const schema = z.object({ email: emailSchema });

export async function POST(req: Request) {
 let body: unknown;
 try {
 body = await req.json();
 } catch {
 return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
 }

 const parsed = schema.safeParse(body);
 if (!parsed.success) {
 return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
 }

 const email = parsed.data.email.toLowerCase();
 const rl = await rateLimit(`forgot:${email}`, RATE_LIMITS.contact);
 if (!rl.ok) {
 return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
 }

 const token = await createPasswordResetToken(email);
 if (token) {
 await sendPasswordReset({
 to: email,
 resetUrl: `${SITE.url}/reset-password?token=${token}`,
 });
 }

 // Always return success so we don't reveal whether an account exists.
 return NextResponse.json({ ok: true });
}