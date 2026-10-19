import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdmin,
  beginTwoFactorSetup,
  confirmTwoFactorSetup,
  disableTwoFactor,
} from "@/lib/auth";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "You must be signed in to manage two-factor authentication." }, { status: 401 });
}

/** Whether the signed-in admin currently has 2FA enabled. */
export async function GET() {
  try {
    const admin = await requireAdmin();
    const user = await prisma.user.findUnique({
      where: { id: admin.id },
      select: { twoFactorEnabled: true, twoFactorPendingSecret: true },
    });
    return NextResponse.json({
      enabled: Boolean(user?.twoFactorEnabled),
      pending: Boolean(user?.twoFactorPendingSecret),
    });
  } catch {
    return unauthorized();
  }
}

export async function POST(req: Request) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return unauthorized();
  }

  let body: { action?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (body.action === "setup") {
    const { secret, backupCodes } = await beginTwoFactorSetup(admin.id);
    return NextResponse.json({ secret, backupCodes });
  }

  if (body.action === "confirm") {
    if (!body.code) return NextResponse.json({ error: "Enter the code from your authenticator app." }, { status: 400 });
    const ok = await confirmTwoFactorSetup(admin.id, body.code);
    if (!ok) return NextResponse.json({ error: "That code doesn't match. Try again." }, { status: 400 });
    return NextResponse.json({ ok: true, enabled: true });
  }

  if (body.action === "disable") {
    await disableTwoFactor(admin.id);
    return NextResponse.json({ ok: true, enabled: false });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
