import { NextResponse } from "next/server";
import { sendDueReviewRequests, sendLowStockDigest } from "@/lib/cron";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Nightly maintenance. Triggered by Vercel Cron (which sends an
 * `Authorization: Bearer $CRON_SECRET` header when CRON_SECRET is set) or a
 * manual call carrying the same secret.
 */
function authorized(req: Request): boolean {
 const secret = process.env.CRON_SECRET;
 // Vercel's cron requests always carry this marker header.
 if (req.headers.get("x-vercel-cron")) return true;
 if (!secret) return process.env.NODE_ENV !== "production";
 return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: Request) {
 if (!authorized(req)) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const [reviewRequests, lowStock] = await Promise.all([
 sendDueReviewRequests().catch((error) => {
 logger.error("cron.review_requests_error", { error: error instanceof Error ? error.message : String(error) });
 return 0;
 }),
 sendLowStockDigest().catch((error) => {
 logger.error("cron.low_stock_error", { error: error instanceof Error ? error.message : String(error) });
 return 0;
 }),
 ]);

 return NextResponse.json({ ok: true, reviewRequests, lowStock });
}
