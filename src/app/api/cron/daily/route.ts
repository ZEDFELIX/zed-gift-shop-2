import { NextResponse } from "next/server";
import { sendAbandonedCheckoutReminders, sendDueReviewRequests, sendLowStockDigest } from "@/lib/cron";
import { createDatabaseBackup } from "@/lib/storage-backups";
import { expireStalePayments } from "@/lib/payment-expiry";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Nightly maintenance. Vercel Cron must send Authorization: Bearer $CRON_SECRET.
 * The x-vercel-cron marker is not an authentication mechanism and is not trusted.
 */
function authorized(req: Request): boolean {
 const secret = process.env.CRON_SECRET;
 if (!secret) return process.env.NODE_ENV !== "production";
 return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: Request) {
 if (!authorized(req)) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const [reviewRequests, paymentReminders, lowStock, backup, expiredPayments] = await Promise.all([
  sendDueReviewRequests().catch((error) => {
   logger.error("cron.review_requests_error", { error: error instanceof Error ? error.message : String(error) });
   return 0;
  }),
  sendAbandonedCheckoutReminders().catch((error) => {
   logger.error("cron.payment_reminders_error", { error: error instanceof Error ? error.message : String(error) });
   return 0;
  }),
  sendLowStockDigest().catch((error) => {
   logger.error("cron.low_stock_error", { error: error instanceof Error ? error.message : String(error) });
   return 0;
  }),
  createDatabaseBackup().catch((error) => {
   logger.error("cron.database_backup_error", { error: error instanceof Error ? error.message : String(error) });
   return null;
  }),
  expireStalePayments().catch((error) => {
   logger.error("cron.expire_payments_error", { error: error instanceof Error ? error.message : String(error) });
   return 0;
  }),
 ]);

 return NextResponse.json({
  ok: true,
  reviewRequests,
  paymentReminders,
  lowStock,
  expiredPayments,
  backup: backup ? { ok: true, ...backup } : { ok: false },
 });
}
