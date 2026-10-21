import { NextResponse } from "next/server";
import { requireAdmin, getSession } from "@/lib/auth";
import { markReportResolved } from "@/lib/data/reviews";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

/** Marks a shopper report as handled so it drops out of the dashboard queue. */
export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    await markReportResolved(id);
  } catch {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  await writeAuditLog({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "review.report_resolved",
    entity: "review_report",
    entityId: id,
  }).catch(() => undefined);

  return NextResponse.json({ ok: true });
}
