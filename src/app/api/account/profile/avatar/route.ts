import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const BUCKET = "customer-avatars";
const MAX_BYTES = 3 * 1024 * 1024;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const form = await req.formData();
  const file = form.get("avatar");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image first." }, { status: 400 });
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return NextResponse.json({ error: "Use a JPG, PNG or WebP image." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Your image must be 3 MB or smaller." }, { status: 400 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Profile photo storage is not configured yet. Please contact the shop." }, { status: 503 });
  }

  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = user.id + "." + extension;
  const base = supabaseUrl.replace(/\/$/, "");
  const headers = { apikey: serviceKey, Authorization: "Bearer " + serviceKey };

  const bucketResponse = await fetch(base + "/storage/v1/bucket", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true, file_size_limit: MAX_BYTES, allowed_mime_types: ["image/jpeg", "image/png", "image/webp"] }),
  });
  if (!bucketResponse.ok && bucketResponse.status !== 409) {
    const detail = await bucketResponse.text();
    if (!detail.toLowerCase().includes("already")) {
      return NextResponse.json({ error: "Could not prepare profile photo storage." }, { status: 502 });
    }
  }

  const upload = await fetch(base + "/storage/v1/object/" + BUCKET + "/" + path, {
    method: "POST",
    headers: { ...headers, "Content-Type": file.type, "x-upsert": "true", "cache-control": "3600" },
    body: await file.arrayBuffer(),
  });
  if (!upload.ok) return NextResponse.json({ error: "Your photo could not be uploaded. Please try again." }, { status: 502 });

  const avatarUrl = base + "/storage/v1/object/public/" + BUCKET + "/" + path + "?v=" + Date.now();
  await prisma.user.update({ where: { id: user.id }, data: { avatarUrl } });
  return NextResponse.json({ avatarUrl });
}
