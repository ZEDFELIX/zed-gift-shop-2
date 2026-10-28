import { NextResponse } from "next/server";
import { z } from "zod";
import { HttpError, requirePermission } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { verifyDatabaseBackup } from "@/lib/storage-backups";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ name: z.string().min(1).max(200) });

export async function POST(req: Request) {
  try {
    if (!(await getSession())) throw new HttpError("Please sign in.", 401);
    await requirePermission("settings.manage");
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 403;
    return NextResponse.json(
      { error: status === 401 ? "Please sign in." : "You do not have permission to verify backups." },
      { status },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a backup file to verify." }, { status: 400 });
  }

  try {
    const result = await verifyDatabaseBackup(parsed.data.name);
    return NextResponse.json({ ok: true, verification: result });
  } catch (error) {
    console.error("[admin/backups] verification failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Backup verification failed. Check server logs and storage configuration." },
      { status: 422 },
    );
  }
}
