import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rate-limit";
import { isImageContentType, maxUploadBytes } from "@/lib/uploads";

export const runtime = "nodejs";

const BUCKET = "review-images";

function supabaseAdmin() {
 const url = process.env.SUPABASE_URL;
 const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
 if (!url || !key) return null;
 return createClient(url, key, { auth: { persistSession: false } });
}

function safeFileName(name: string): string {
 const base = name.split(/[\\/]/).pop() ?? "image";
 const cleaned = base.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-");
 const withExt = /\.(jpe?g|png|webp|gif|avif)$/.test(cleaned) ? cleaned : `${cleaned}.jpg`;
 return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${withExt}`;
}

function clientIp(req: Request): string {
 const forwarded = req.headers.get("x-forwarded-for");
 if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
 return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Customer photo upload for product reviews. Anonymous by design (reviews can be
 * left by guests), so it is rate-limited per IP and restricted to images.
 * Returns the public URL to attach to the review.
 */
export async function POST(req: Request) {
 const rl = await rateLimit(`review-image:${clientIp(req)}`, { limit: 20, windowSeconds: 3600 });
 if (!rl.ok) {
 return NextResponse.json(
 { error: `Too many uploads. Try again in ${rl.retryAfterSeconds}s.` },
 { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
 );
 }

 const supabase = supabaseAdmin();
 if (!supabase) {
 return NextResponse.json({ error: "Photo uploads are not available right now." }, { status: 503 });
 }

 let file: File | null = null;
 try {
 const form = await req.formData();
 const value = form.get("file");
 if (value instanceof File) file = value;
 } catch {
 return NextResponse.json({ error: "Send the photo as multipart form data." }, { status: 400 });
 }
 if (!file || file.size === 0) {
 return NextResponse.json({ error: "Choose a photo first." }, { status: 400 });
 }
 if (!isImageContentType(file.type) || file.type === "image/svg+xml") {
 return NextResponse.json({ error: "Only JPG, PNG, WebP, GIF or AVIF photos are allowed." }, { status: 400 });
 }
 if (file.size > maxUploadBytes()) {
 return NextResponse.json({ error: "Photos must be 8 MB or smaller." }, { status: 400 });
 }

 const path = safeFileName(file.name || "review.jpg");
 const bytes = new Uint8Array(await file.arrayBuffer());

 let uploaded = await supabase.storage.from(BUCKET).upload(path, bytes, {
 contentType: file.type,
 upsert: false,
 });
 if (uploaded.error && /bucket not found|not found/i.test(uploaded.error.message)) {
 const created = await supabase.storage.createBucket(BUCKET, { public: true });
 if (created.error) {
 return NextResponse.json({ error: "Photo storage is not ready." }, { status: 503 });
 }
 uploaded = await supabase.storage.from(BUCKET).upload(path, bytes, {
 contentType: file.type,
 upsert: false,
 });
 }
 if (uploaded.error) {
 return NextResponse.json({ error: "Upload failed. Try a smaller photo." }, { status: 500 });
 }

 const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
 return NextResponse.json({ url: data.publicUrl });
}
