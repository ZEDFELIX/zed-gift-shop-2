import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { parsePagination, pageMeta, fail } from "@/lib/api";
import { listNotifications, markRead } from "@/lib/notifications";

export const runtime = "nodejs";

/** Customer inbox + read receipts. */
export async function GET(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return fail("Please sign in.", 401);
  }

  const url = new URL(req.url);
  const { page, pageSize } = parsePagination(url, { pageSize: 30 });
  const unreadOnly = url.searchParams.get("unread") === "true";

  const { items, total, unread } = await listNotifications({ userId: user.id, unreadOnly, page, pageSize });
  return NextResponse.json({ data: items, meta: { ...pageMeta(page, pageSize, total), unread } });
}

const readSchema = z.object({ id: z.string().max(64).optional() });

export async function POST(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return fail("Please sign in.", 401);
  }

  let body: z.infer<typeof readSchema> = {};
  try {
    body = readSchema.parse(await req.json());
  } catch {
    body = {};
  }

  await markRead(user.id, body.id);
  return NextResponse.json({ data: { ok: true } });
}
