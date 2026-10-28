import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api";
import { createDatabaseBackup, listDatabaseBackups } from "@/lib/storage-backups";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePermission("settings.manage");
    const backups = await listDatabaseBackups();
    return NextResponse.json({ backups, retentionDays: 30 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message === "AUTH_REQUIRED" ? 401
      : message === "ADMIN_REQUIRED" || message === "FORBIDDEN" || message.includes("permission") ? 403
      : typeof error === "object" && error !== null && "status" in error && typeof error.status === "number" ? error.status
      : 500;
    const messageForClient = status === 401 ? "Please sign in."
      : status === 403 ? "You do not have permission to view backups."
      : "Backup storage is unavailable.";
    return NextResponse.json({ error: messageForClient }, { status });
  }
}

export async function POST() {
  try {
    await requirePermission("settings.manage");
    const backup = await createDatabaseBackup();
    return NextResponse.json({ ok: true, backup }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message === "AUTH_REQUIRED" ? 401
      : message === "ADMIN_REQUIRED" || message === "FORBIDDEN" || message.includes("permission") ? 403
      : typeof error === "object" && error !== null && "status" in error && typeof error.status === "number" ? error.status
      : 500;
    const messageForClient = status === 401 ? "Please sign in."
      : status === 403 ? "You do not have permission to create backups."
      : "Backup failed. Check server logs and storage configuration.";
    return NextResponse.json({ error: messageForClient }, { status });
  }
}
