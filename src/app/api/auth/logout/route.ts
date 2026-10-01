import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_KEYS } from "@/lib/constants";
import { getSession } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST() {
  const session = await getSession();
  const store = await cookies();

  store.set(COOKIE_KEYS.session, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

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