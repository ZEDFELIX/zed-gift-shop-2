import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/validations";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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

  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  let { data: profile, error } = await admin
    .from("User")
    .select("id,name,email,phone,role,status")
    .eq("authUserId", authData.user.id)
    .maybeSingle();

  if (error) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: "Unable to load your account. Please try again." }, { status: 500 });
  }

  // Support existing customer profiles created before the Supabase Auth migration.
  if (!profile && authData.user.email) {
    const legacy = await admin.from("User")
      .select("id,name,email,phone,role,status")
      .eq("email", authData.user.email.toLowerCase())
      .maybeSingle();
    if (legacy.error) {
      await supabase.auth.signOut();
      return NextResponse.json({ error: "Unable to load your account. Please try again." }, { status: 500 });
    }
    if (legacy.data) {
      const linked = await admin.from("User")
        .update({ authUserId: authData.user.id, updatedAt: new Date().toISOString() })
        .eq("id", legacy.data.id);
      if (linked.error) {
        await supabase.auth.signOut();
        return NextResponse.json({ error: "Unable to link your account. Please contact support." }, { status: 500 });
      }
      profile = legacy.data;
    }
  }

  if (!profile || profile.status !== "ACTIVE") {
    await supabase.auth.signOut();
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  const role = profile.role === "ADMIN" || profile.role === "STAFF" ? profile.role : "CUSTOMER";
  return NextResponse.json({
    user: {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      role,
    },
  });
}
