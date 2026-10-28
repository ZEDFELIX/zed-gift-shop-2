import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requirePermission } from "@/lib/api";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { isImageContentType, maxUploadBytes } from "@/lib/uploads";

export const runtime = "nodejs";

const BUCKET = "product-images";

function supabaseAdmin() {
  // Prefer the Zed Gift Shop-specific project settings and keep each URL paired
  // with a key from the same project. Generic Supabase variables may target a
  // different project in the same Vercel environment.
  const candidates = [
    {
      url: process.env.zedgiftshop_SUPABASE_URL || process.env.NEXT_PUBLIC_zedgiftshop_SUPABASE_URL,
      key: process.env.zedgiftshop_SUPABASE_SERVICE_ROLE_KEY || process.env.zedgiftshop_SUPABASE_SECRET_KEY,
    },
    {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      key: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY,
    },
    {
      url: process.env.SUPABASE_URL,
      key: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY,
    },
  ];
  const config = candidates.find(({ url, key }) => {
    if (!url?.trim() || !key?.trim()) return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:" && parsed.hostname.endsWith(".supabase.co");
    } catch {
      return false;
    }
  });
  if (!config?.url || !config.key) return null;
  return createClient(config.url, config.key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function safeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "image";
  const cleaned = base.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-");
  const withExt = /\.(jpe?g|png|webp|gif|avif|svg)$/.test(cleaned) ? cleaned : `${cleaned}.jpg`;
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${withExt}`;
}

/**
 * Device upload for product pictures (phone camera roll or computer files).
 * Stores in Supabase Storage and returns a public URL for the product form.
 */
export async function POST(req: Request) {
  let actor;
  try {
    actor = await requirePermission("products.manage");
  } catch {
    return NextResponse.json({ error: "You do not have permission to upload images." }, { status: 403 });
  }

  const supabase = supabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Image uploads are not configured. Ask the store owner to set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 },
    );
  }

  let file: File | null = null;
  try {
    const form = await req.formData();
    const value = form.get("file");
    if (value instanceof File) file = value;
  } catch {
    return NextResponse.json({ error: "Send the picture as multipart form data." }, { status: 400 });
  }
  if (!file || file.size === 0) {
    return NextResponse.json({ error: "Choose a picture first." }, { status: 400 });
  }
  if (!isImageContentType(file.type)) {
    return NextResponse.json({ error: "Only JPG, PNG, WebP, GIF or SVG pictures are allowed." }, { status: 400 });
  }
  if (file.size > maxUploadBytes()) {
    return NextResponse.json({ error: "Pictures must be 8 MB or smaller." }, { status: 400 });
  }

  const path = safeFileName(file.name || "image.jpg");
  const bytes = new Uint8Array(await file.arrayBuffer());

  let uploaded = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type,
    upsert: false,
  });
  if (uploaded.error && /bucket not found|not found/i.test(uploaded.error.message)) {
    const created = await supabase.storage.createBucket(BUCKET, { public: true });
    if (created.error) {
      return NextResponse.json(
        { error: "Image storage is not ready. Ask the store owner to create a public Supabase bucket called product-images." },
        { status: 503 },
      );
    }
    uploaded = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType: file.type,
      upsert: false,
    });
  }
  if (uploaded.error) {
    return NextResponse.json({ error: "Upload failed. Try a smaller picture." }, { status: 500 });
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const meta = await requestMeta();
  await writeAuditLog({
    ...meta,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: "product.image_uploaded",
    entity: "ProductImage",
    entityId: path,
  });
  return NextResponse.json({ url: data.publicUrl });
}
