import { NextResponse } from "next/server";
import { getCurrentUser, createPasswordResetToken } from "@/lib/auth";
import { sendAdminPasswordReset } from "@/lib/email";
import { SITE } from "@/lib/constants";

export const runtime = "nodejs";

export async function POST() {
 const admin = await getCurrentUser();
 if (!admin || admin.role !== "ADMIN") {
  return NextResponse.json({ error: "Only the owner can request an admin password change." }, { status: 403 });
 }

 const token = await createPasswordResetToken(admin.email);
 if (!token) {
  return NextResponse.json({ error: "Admin account could not be found." }, { status: 404 });
 }

 const result = await sendAdminPasswordReset({
  to: admin.email,
  resetUrl: `${SITE.url}/reset-password?token=${token}`,
 });

 if (!result.ok) {
  return NextResponse.json({ error: "The password-change email could not be sent. Check the store email configuration." }, { status: 503 });
 }

 return NextResponse.json({ ok: true });
}
