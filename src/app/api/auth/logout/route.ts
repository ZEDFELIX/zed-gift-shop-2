import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST() {
  const session = await getSession();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (session) {
    await writeAuditLog({
      actorId: session.sub,
      actorEmail: session.email,
      actorRole: session.role,
      action: "auth.logout",
      entity: "User",
      entityId: session.sub,
    });
  }

  if (error) {
    return NextResponse.json({ error: "Could not end the session. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
