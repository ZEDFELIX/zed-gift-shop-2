import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { reportReview } from "@/lib/data/reviews";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/** "Report this review" flag for administrators. Guests may report too. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const rl = await rateLimit(`review-report:${clientIp(req)}`, RATE_LIMITS.reviewReport);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many reports. Try again in ${rl.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  const { id } = await params;

  let reason = "";
  try {
    const body = (await req.json()) as { reason?: unknown } | null;
    reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 500) : "";
  } catch {
    reason = "";
  }

  const session = await getSession();

  try {
    const result = await reportReview(id, reason || "Reported by a shopper", session?.sub ?? null);
    return NextResponse.json({ ok: true, duplicate: result.duplicate });
  } catch {
    return NextResponse.json({ error: "Review not found." }, { status: 404 });
  }
}
