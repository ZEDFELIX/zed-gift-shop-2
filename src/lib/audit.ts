import "server-only";

import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Admin role/permission matrix.
 *
 * The Prisma `Role` enum only has CUSTOMER / STAFF / ADMIN, so finer-grained
 * responsibilities are expressed as capabilities layered on top of the role.
 * Everything here is server-side; the client never decides what an admin may do.
 */

export type AdminRole = Extract<Role, "ADMIN" | "STAFF">;

export const PERMISSIONS = [
  "analytics.view",
  "audit.view",
  "categories.manage",
  "content.manage",
  "coupons.manage",
  "customers.manage",
  "customers.view",
  "deliveries.manage",
  "inventory.manage",
  "notifications.view",
  "orders.manage",
  "payments.manage",
  "payments.view",
  "products.manage",
  "refunds.manage",
  "reviews.manage",
  "settings.manage",
  "staff.manage",
  "variants.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL: readonly Permission[] = PERMISSIONS;

/** Capabilities granted per admin role. ADMIN is intentionally unrestricted. */
export const ROLE_PERMISSIONS: Record<AdminRole, readonly Permission[]> = {
  ADMIN: ALL,
  STAFF: [
    "analytics.view",
    "categories.manage",
    "content.manage",
    "coupons.manage",
    "customers.view",
    "deliveries.manage",
    "inventory.manage",
    "notifications.view",
    "orders.manage",
    "payments.view",
    "products.manage",
    "reviews.manage",
    "variants.manage",
  ],
};

export function isAdminRole(role: string | undefined | null): role is AdminRole {
  return role === "ADMIN" || role === "STAFF";
}

export function can(role: string | undefined | null, permission: Permission): boolean {
  if (!isAdminRole(role)) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function permissionsFor(role: string | undefined | null): readonly Permission[] {
  return isAdminRole(role) ? ROLE_PERMISSIONS[role] : [];
}

export type AuditInput = {
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  orderId?: string | null;
  before?: unknown;
  after?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
};

/** Trims a value to a storable JSON blob; drops anything unserialisable. */
function safeJson(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  try {
    const json = JSON.stringify(value, replacer);
    if (!json) return undefined;
    return json.length > 20_000 ? `${json.slice(0, 20_000)}…` : json;
  } catch {
    return undefined;
  }
}

/** Redacts secrets and scrubs cycles / BigInt so audit writes never fail. */
function replacer(key: string, value: unknown): unknown {
  const lower = key.toLowerCase();
  if (
    lower.includes("password") ||
    lower.includes("passwordhash") ||
    lower.includes("token") ||
    lower.includes("secret") ||
    lower.includes("apikey") ||
    lower.includes("authorization") ||
    lower.includes("rawcallback")
  ) {
    return "[redacted]";
  }
  if (typeof value === "bigint") return value.toString();
  return value;
}

/**
 * Append-only accountability trail (Kenya DPA 2019).
 *
 * Deliberately never throws: losing the request is worse than losing the log
 * entry, and a failed audit must never break checkout or an admin action.
 */
export async function writeAuditLog(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        actorEmail: input.actorEmail ?? null,
        actorRole: input.actorRole ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        orderId: input.orderId ?? null,
        beforeJson: safeJson(input.before),
        afterJson: safeJson(input.after),
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent?.slice(0, 300) ?? null,
      },
    });
  } catch (error) {
    console.error("[audit] failed to record entry", {
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/** Request metadata helper so handlers do not repeat header parsing. */
export async function requestMeta(): Promise<{ ipAddress: string | null; userAgent: string | null }> {
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    return {
      ipAddress: forwarded?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null,
      userAgent: h.get("user-agent"),
    };
  } catch {
    return { ipAddress: null, userAgent: null };
  }
}