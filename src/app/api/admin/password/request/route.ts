import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendAdminPasswordReset } from "@/lib/email";
import { SITE } from "@/lib/constants";

export const runtime = "nodejs";

export async function POST() {
  const adminUser = await getCurrentUser();
  if (!adminUser || adminUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Only the owner can request an admin password change." }, { status: 403 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email: adminUser.email,
    options: { redirectTo: `${SITE.url}/reset-password` },
  });

  const resetUrl = data.properties?.action_link;
  if (error || !resetUrl) {
    return NextResponse.json({ error: "Could not create a secure password-reset link. Please try again." }, { status: 503 });
  }

  const result = await sendAdminPasswordReset({ to: adminUser.email, resetUrl });
  if (!result.ok) {
    return NextResponse.json({ error: "The password-change email could not be sent. Check the store email configuration." }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
