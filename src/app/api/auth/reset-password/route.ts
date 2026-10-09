import { NextResponse } from "next/server";
import { passwordSchema } from "@/lib/validations";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({ password: passwordSchema });

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({
      error: parsed.error.issues[0]?.message ?? "Check the new password.",
    }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({
      error: "That reset link is invalid or has expired. Request a new one.",
    }, { status: 400 });
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return NextResponse.json({ error: "Could not reset your password. Request a new link and try again." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
