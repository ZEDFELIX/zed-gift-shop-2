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
    const status = message.includes("permission") || message.includes("FORBIDDEN") ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? "You do not have permission to view backups." : "Backup storage is unavailable." }, { status });
  }
}

export async function POST() {
  try {
    await requirePermission("settings.manage");
    const backup = await createDatabaseBackup();
    return NextResponse.json({ ok: true, backup }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.includes("permission") || message.includes("FORBIDDEN") ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? "You do not have permission to create backups." : "Backup failed. Check server logs and storage configuration." }, { status });
  }
}
