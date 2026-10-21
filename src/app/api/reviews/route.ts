import { NextResponse } from "next/server";
import { reviewSchema } from "@/lib/validations";
import { createReview, listApprovedReviews, ratingBreakdown } from "@/lib/data/reviews";
import { getSession } from "@/lib/auth";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";

function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function GET(req: Request) {
  const productId = new URL(req.url).searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "productId is required." }, { status: 400 });
  const reviews = await listApprovedReviews(productId);
  return NextResponse.json({ data: reviews, summary: ratingBreakdown(reviews) });
}

export async function POST(req: Request) {
  // Submission throttle: five reviews per IP per hour keeps spam submit loops out.
  const rl = await rateLimit(`review-post:${clientIp(req)}`, RATE_LIMITS.reviewSubmit);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many reviews submitted. Try again in ${rl.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Honeypot: real shoppers never fill the hidden "website" field. Bots do, so we
  // answer a success-shaped response without persisting anything.
  const honeypot =
    typeof body === "object" && body !== null && "website" in body
      ? String((body as { website: unknown }).website ?? "")
      : "";
  if (honeypot.trim().length > 0) {
    return NextResponse.json({ ok: true, id: null });
  }

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid review." }, { status: 400 });
  }

  const session = await getSession();
  const result = await createReview({
    productId: parsed.data.productId,
    userId: session?.sub ?? null,
    rating: parsed.data.rating,
    title: parsed.data.title,
    comment: parsed.data.comment,
    images: parsed.data.images,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id: result.id });
}