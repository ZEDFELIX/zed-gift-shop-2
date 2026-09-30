import { NextResponse } from "next/server";
import { reviewSchema } from "@/lib/validations";
import { createReview } from "@/lib/data/reviews";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
 let body: unknown;
 try {
 body = await req.json();
 } catch {
 return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
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