import { NextResponse } from "next/server";
import { z } from "zod";
import { passwordSchema } from "@/lib/validations";
import { resetPassword } from "@/lib/auth";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

const schema = z.object({
 token: z.string().min(10).max(200),
 password: passwordSchema,
});

export async function POST(req: Request) {
 const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
 const clientIp = forwardedFor || req.headers.get("x-real-ip") || "unknown";
 const rl = await rateLimit("password-reset:" + clientIp, RATE_LIMITS.passwordReset);
 if (!rl.ok) {
   return NextResponse.json({ error: "Too many reset attempts. Please wait a few minutes and try again." }, { status: 429 });
 }

 let body: unknown;
 try {
 body = await req.json();
 } catch {
 return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
 }

 const parsed = schema.safeParse(body);
 if (!parsed.success) {
 return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the token and password." }, { status: 400 });
 }

 const ok = await resetPassword(parsed.data.token, parsed.data.password);
 if (!ok) {
 return NextResponse.json({ error: "That reset link is invalid or has expired. Request a new one." }, { status: 400 });
 }

 return NextResponse.json({ ok: true });
}