import "server-only";

import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { requireAdmin, requireUser, type SessionPayload } from "@/lib/auth";
import { can, type Permission } from "@/lib/audit";
import { logger } from "@/lib/logger";

/**
 * Shared REST plumbing.
 *
 * Every endpoint returns either `{ data }` or `{ error }` with a stable shape,
 * carries a request id for log correlation, and reports Zod field errors so a
 * mobile client can attach them to the right input.
 */

export type ApiSuccess<T> = { data: T; meta?: Record<string, unknown> };
export type ApiFailure = { error: string; fields?: Record<string, string[]>; requestId?: string };

function requestId(): string {
  return crypto.randomUUID();
}

export function ok<T>(data: T, init?: { status?: number; meta?: Record<string, unknown> }) {
  return NextResponse.json<ApiSuccess<T>>(
    { data, ...(init?.meta ? { meta: init.meta } : {}) },
    { status: init?.status ?? 200 },
  );
}

export function fail(error: string, status = 400, fields?: Record<string, string[]>) {
  return NextResponse.json<ApiFailure>(
    { error, ...(fields ? { fields } : {}), requestId: requestId() },
    { status },
  );
}

/** Converts a ZodError into a per-field map the client can render inline. */
export function validationFail(error: ZodError) {
  const flattened = error.flatten();
  const fields: Record<string, string[]> = {};
  for (const [key, messages] of Object.entries(flattened.fieldErrors)) {
    if (messages && messages.length) fields[key] = messages as string[];
  }
  const first = error.issues[0]?.message ?? "Please check the fields.";
  return NextResponse.json<ApiFailure>(
    { error: first, fields, requestId: requestId() },
    { status: 422 },
  );
}

export class HttpError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/**
 * Wraps a handler so auth failures, validation and unexpected errors all become
 * correct HTTP responses instead of 500s, and logs an unexpected error once.
 */
export function route<T>(
  handler: (req: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<T>,
) {
  return async (req: Request, ctx: { params: Promise<Record<string, string>> }) => {
    const id = requestId();
    try {
      return await handler(req, ctx);
    } catch (error) {
      if (error instanceof HttpError) return fail(error.message, error.status);
      const message = error instanceof Error ? error.message : String(error);
      if (message === "AUTH_REQUIRED") return fail("Please sign in.", 401);
      if (message === "ADMIN_REQUIRED") return fail("Admin access required.", 403);
      if (message === "FORBIDDEN") return fail("You do not have permission to do that.", 403);
      logger.error("api.unhandled_error", { requestId: id, method: req.method, url: req.url, error: message });
      return NextResponse.json<ApiFailure>({ error: "Something went wrong.", requestId: id }, { status: 500 });
    }
  };
}

/** Resolves the signed-in admin and asserts a capability. */
export async function requirePermission(permission: Permission) {
  const user = await requireAdmin();
  if (!can(user.role, permission)) throw new HttpError("You do not have permission to do that.", 403);
  return user;
}

export async function optionalUser(): Promise<SessionPayload | null> {
  const { getSession } = await import("@/lib/auth");
  return getSession();
}

export async function requireSession() {
  return requireUser();
}

/* ------------------------------- pagination ------------------------------- */

export type PageMeta = { page: number; pageSize: number; total: number; pages: number };

export type Pagination = { page: number; pageSize: number; skip: number; take: number };

/** Parses `page`/`pageSize` with sane clamps so a caller can't force a huge scan. */
export function parsePagination(url: URL, defaults?: { pageSize?: number; max?: number }): Pagination {
  const pageSize = clampInt(url.searchParams.get("pageSize"), defaults?.pageSize ?? 20, 1, defaults?.max ?? 100);
  const page = clampInt(url.searchParams.get("page"), 1, 1, 100_000);
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function pageMeta(page: number, pageSize: number, total: number): PageMeta {
  return { page, pageSize, total, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

function clampInt(value: string | null, fallback: number, min: number, max: number): number {
  const n = value ? Number.parseInt(value, 10) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** Parses and validates a JSON body, raising a 422 with field errors. */
export async function parseBody<S extends ZodType>(req: Request, schema: S): Promise<ReturnType<S["parse"]>> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new HttpError("Invalid JSON body.", 400);
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    const flattened = result.error.flatten();
    const fields: Record<string, string[]> = {};
    for (const [key, messages] of Object.entries(flattened.fieldErrors)) {
      if (messages && messages.length) fields[key] = messages as string[];
    }
    const error = new HttpError(result.error.issues[0]?.message ?? "Please check the fields.", 422);
    (error as HttpError & { fields?: Record<string, string[]> }).fields = fields;
    throw error;
  }
  return result.data;
}

/** Sorts helper: only whitelisted columns may be sorted, preventing injection. */
export function parseSort<T extends string>(
  url: URL,
  allowed: readonly T[],
  fallback: T,
): { field: T; direction: "asc" | "desc" } {
  const raw = url.searchParams.get("sort");
  const dir = url.searchParams.get("dir") === "asc" ? "asc" : "desc";
  const field = (allowed as readonly string[]).includes(raw ?? "") ? (raw as T) : fallback;
  return { field, direction: dir };
}

/** Escape for use inside a Prisma `contains` when the DB is not full-text. */
export function like(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}