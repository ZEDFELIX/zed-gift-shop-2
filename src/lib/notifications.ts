import "server-only";

import type { NotificationChannel, NotificationEvent, NotificationType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

/**
 * Notification fan-out.
 *
 * Every message is persisted as a `Notification` row first (status QUEUED), so
 * there is a durable record and an in-app inbox even when a channel is not
 * configured. Email is then attempted and the row is updated with the outcome.
 * SMS/WhatsApp are adapter stubs: they enqueue but mark SKIPPED until a vendor
 * is chosen, which keeps the schema honest instead of pretending to deliver.
 */

export type NotificationInput = {
  userId: string;
  type: NotificationType;
  event: NotificationEvent;
  title: string;
  body: string;
  channel?: NotificationChannel;
  toEmail?: string | null;
  toPhone?: string | null;
  data?: Record<string, unknown>;
};

export type CreateResult = { id: string; status: string };

/** Persists the notification, then best-effort delivers it. Never throws. */
export async function notify(input: NotificationInput): Promise<CreateResult | null> {
  try {
    const channel = input.channel ?? "EMAIL";
    const row = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        event: input.event,
        channel,
        title: input.title,
        body: input.body,
        toEmail: input.toEmail ?? null,
        toPhone: input.toPhone ?? null,
        status: "QUEUED",
      },
      select: { id: true },
    });

    if (channel === "EMAIL" && input.toEmail) {
      void dispatchEmail(row.id, input);
    } else if (channel !== "EMAIL") {
      await markSkipped(row.id, `No ${channel} provider configured yet.`);
    }

    return { id: row.id, status: "QUEUED" };
  } catch (error) {
    logger.error("notification.create_failed", {
      event: input.event,
      userId: input.userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function dispatchEmail(id: string, input: NotificationInput) {
  try {
    const result = await sendEmail({
      to: input.toEmail!,
      subject: input.title,
      text: input.body,
      html: `<p>${escapeHtml(input.body).replace(/\n/g, "<br/>")}</p>`,
    });
    await prisma.notification.update({
      where: { id },
      data: result.ok
        ? { status: "SENT", sentAt: new Date(), providerMessageId: result.messageId ?? null, provider: "smtp" }
        : {
            status: "FAILED",
            failedAt: new Date(),
            error: result.error ?? "Email send failed.",
            provider: "smtp",
          },
    });
  } catch (error) {
    await prisma.notification
      .update({
        where: { id },
        data: { status: "FAILED", failedAt: new Date(), error: error instanceof Error ? error.message : "Unknown error" },
      })
      .catch(() => undefined);
  }
}

async function markSkipped(id: string, reason: string) {
  await prisma.notification
    .update({ where: { id }, data: { status: "SKIPPED", error: reason } })
    .catch(() => undefined);
}

/** Sends the same operational alert to every active admin. */
export async function notifyAdmins(input: {
  type?: NotificationType;
  event: NotificationEvent;
  title: string;
  body: string;
}): Promise<void> {
  try {
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "STAFF"] }, status: "ACTIVE" },
      select: { id: true, email: true },
    });
    await Promise.all(
      admins.map((admin) =>
        notify({
          userId: admin.id,
          type: input.type ?? "SYSTEM",
          event: input.event,
          title: input.title,
          body: input.body,
          toEmail: admin.email,
        }),
      ),
    );
  } catch (error) {
    logger.error("notification.admin_fanout_failed", {
      event: input.event,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export type InboxQuery = {
  userId: string;
  unreadOnly?: boolean;
  page: number;
  pageSize: number;
};

export async function listNotifications(query: InboxQuery) {
  const where: Prisma.NotificationWhereInput = {
    userId: query.userId,
    ...(query.unreadOnly ? { read: false } : {}),
  };
  const [items, total, unread] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: query.userId, read: false } }),
  ]);
  return { items, total, unread };
}

export async function markRead(userId: string, id?: string) {
  await prisma.notification.updateMany({
    where: { userId, read: false, ...(id ? { id } : {}) },
    data: { read: true },
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}