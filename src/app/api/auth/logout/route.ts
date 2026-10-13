import { NextResponse } from "next/server";
import { getSession, clearSessionCookie } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST() {
  const session = await getSession();
  await clearSessionCookie();

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

  return NextResponse.json({ ok: true });
}