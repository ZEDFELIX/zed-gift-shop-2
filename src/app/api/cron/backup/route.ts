import "server-only";

import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createDatabaseBackup, verifyDatabaseBackup } from "@/lib/storage-backups";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Secret-protected, backup-only operational endpoint. Unlike the daily
 * maintenance job, this does not send reminders or mutate order state.
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Backup trigger is not configured." }, { status: 503 });
  }

  const supplied = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const a = Buffer.from(supplied);
  const b = Buffer.from(secret);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const backup = await createDatabaseBackup();
    const name = backup.path.split("/").pop();
    if (!name) throw new Error("Backup was created without a filename.");
    const verification = await verifyDatabaseBackup(name);
    return NextResponse.json({
      ok: true,
      backup,
      verification: {
        valid: verification.valid,
        tableCount: verification.tableCount,
        rowCount: verification.rowCount,
        compressedBytes: verification.compressedBytes,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("[cron/backup] manual backup or verification failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: "Backup or integrity verification failed. Check server logs." }, { status: 500 });
  }
}
