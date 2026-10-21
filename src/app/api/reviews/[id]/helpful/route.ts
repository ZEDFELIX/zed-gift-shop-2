import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { toggleHelpfulVote } from "@/lib/data/reviews";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Toggles the signed-in customer's "helpful" vote on a review. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.sub) {
    return NextResponse.json({ error: "Please sign in to mark reviews as helpful." }, { status: 401 });
  }

  const { id } = await params;

  const rl = await rateLimit(`review-helpful:${session.sub}`, RATE_LIMITS.reviewHelpful);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Slow down a little. Try again in ${rl.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  try {
    const result = await toggleHelpfulVote(id, session.sub);
    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json({ error: "Review not found." }, { status: 404 });
  }
}
