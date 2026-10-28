import { NextResponse } from "next/server";
import { HttpError, requirePermission } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { createDatabaseBackup, listDatabaseBackups } from "@/lib/storage-backups";

async function authorizeBackupAccess() {
  if (!(await getSession())) throw new HttpError("Please sign in.", 401);
  await requirePermission("settings.manage");
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await authorizeBackupAccess();
    const backups = await listDatabaseBackups();
    return NextResponse.json({ backups, retentionDays: 30 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = error instanceof HttpError ? error.status
      : message === "AUTH_REQUIRED" ? 401
      : message === "ADMIN_REQUIRED" || message === "FORBIDDEN" || message.includes("permission") ? 403
      : 500;
    const messageForClient = status === 401 ? "Please sign in."
      : status === 403 ? "You do not have permission to view backups."
      : "Backup storage is unavailable.";
    return NextResponse.json({ error: messageForClient }, { status });
  }
}

export async function POST() {
  try {
    await authorizeBackupAccess();
    const backup = await createDatabaseBackup();
    return NextResponse.json({ ok: true, backup }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = error instanceof HttpError ? error.status
      : message === "AUTH_REQUIRED" ? 401
      : message === "ADMIN_REQUIRED" || message === "FORBIDDEN" || message.includes("permission") ? 403
      : 500;
    const messageForClient = status === 401 ? "Please sign in."
      : status === 403 ? "You do not have permission to create backups."
      : "Backup failed. Check server logs and storage configuration.";
    return NextResponse.json({ error: messageForClient }, { status });
  }
}
