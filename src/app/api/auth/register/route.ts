import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/validations";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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
    return NextResponse.json({
      error: parsed.error.issues[0]?.message ?? "Please check your details.",
    }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const admin = createSupabaseAdminClient();
  const { data: existing, error: lookupError } = await admin
    .from("User").select("id").eq("email", email).maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: "Account registration is temporarily unavailable." }, { status: 503 });
  }
  if (existing) {
    return NextResponse.json({
      error: "An account with that email already exists. Try logging in instead.",
    }, { status: 409 });
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { name: parsed.data.name, phone: parsed.data.phone || null },
    app_metadata: { role: "CUSTOMER" },
  });

  if (createError || !created.user) {
    const duplicate = createError?.message.toLowerCase().includes("already");
    return NextResponse.json({
      error: duplicate
        ? "An account with that email already exists. Try logging in instead."
        : "Could not create your account. Please try again.",
    }, { status: duplicate ? 409 : 400 });
  }

  const profileId = randomUUID();
  const { error: profileError } = await admin.from("User").insert({
    id: profileId,
    authUserId: created.user.id,
    name: parsed.data.name,
    email,
    phone: parsed.data.phone || null,
    passwordHash: null,
    role: "CUSTOMER",
    status: "ACTIVE",
    updatedAt: new Date().toISOString(),
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({
      error: "Could not finish setting up your account. Please try again.",
    }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (signInError) {
    await admin.from("User").delete().eq("id", profileId);
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: "Your account was created, but sign-in failed. Please log in." }, { status: 503 });
  }

  return NextResponse.json({
    user: {
      id: profileId,
      name: parsed.data.name,
      email,
      phone: parsed.data.phone || null,
      role: "CUSTOMER",
    },
  }, { status: 201 });
}
