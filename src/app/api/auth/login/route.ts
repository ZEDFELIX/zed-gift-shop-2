import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
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
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Enter your email and password." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const rl = await rateLimit(`login:${email}`, RATE_LIMITS.login);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${Math.ceil(rl.retryAfterSeconds / 60)} minutes.` },
      { status: 429 },
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const passwordValid = user?.passwordHash
    ? await verifyPassword(parsed.data.password, user.passwordHash)
    : false;

  // A configured environment secret is used only to bootstrap the initial
  // account in the seed step. It is never a permanent login bypass: all
  // subsequent logins must match the stored password hash.
  if (!user || user.status !== "ACTIVE" || !passwordValid) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  await setSessionCookie({
    sub: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
  });

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  });
}
