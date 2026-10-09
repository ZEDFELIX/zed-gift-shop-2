import { NextResponse } from "next/server";
import { z } from "zod";
import { emailSchema } from "@/lib/validations";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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

  const email = parsed.data.email.trim().toLowerCase();
  const rl = await rateLimit(`forgot:${email}`, RATE_LIMITS.contact);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE.url}/reset-password`,
  });

  if (error) {
    // Avoid disclosing whether the email belongs to an account.
    console.error("[auth] Supabase password recovery request failed:", error.message);
  }
  return NextResponse.json({ ok: true });
}
