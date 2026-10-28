import "server-only";

import { gzipSync } from "node:zlib";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

const BUCKET = "zed-gift-shop-backups";
const RETENTION_DAYS = 30;

function storageAdmin() {
  const url = process.env.SUPABASE_URL || process.env.zedgiftshop_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.zedgiftshop_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase Storage backup credentials are not configured.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/**
 * Creates a compressed, private JSON snapshot of every public PostgreSQL table.
 * Table names come from information_schema and are identifier-validated before use.
 */
export async function createDatabaseBackup() {
  const supabase = storageAdmin();
  const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;

  const snapshot: { format: string; createdAt: string; tables: Record<string, unknown[]> } = {
    format: "zed-gift-shop-database-backup-v1",
    createdAt: new Date().toISOString(),
    tables: {},
  };

  for (const { table_name } of tables) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(table_name)) continue;
    const rows = await prisma.$queryRawUnsafe<Array<{ rows: unknown[] }>>(
      `SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) AS rows FROM "${table_name}" t`,
    );
    snapshot.tables[table_name] = rows[0]?.rows ?? [];
  }

  const json = JSON.stringify(snapshot);
  const compressed = gzipSync(Buffer.from(json, "utf8"));
  if (compressed.byteLength > 45 * 1024 * 1024) {
    throw new Error("Backup is larger than the safe single-upload limit; use a database-native backup for this store size.");
  }

  const createdAt = new Date();
  const path = `daily/${createdAt.toISOString().replace(/[:.]/g, "-")}.json.gz`;
  const { data: existingBucket } = await supabase.storage.getBucket(BUCKET);
  if (!existingBucket) {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: "50MiB",
      allowedMimeTypes: ["application/gzip", "application/octet-stream"],
    });
    if (error && !/already exists/i.test(error.message)) throw new Error(`Could not create private backup bucket: ${error.message}`);
  }

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, compressed, {
    contentType: "application/gzip",
    upsert: false,
  });
  if (uploadError) throw new Error(`Backup upload failed: ${uploadError.message}`);

  // Keep the newest 30 days of backups to control free-tier storage usage.
  const { data: files, error: listError } = await supabase.storage.from(BUCKET).list("daily", {
    limit: 1000,
    sortBy: { column: "name", order: "desc" },
  });
  if (!listError && files) {
    const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const expired = files
      .filter((file) => {
        // Only delete files with trusted storage metadata; never infer dates from filenames.
        const created = file.created_at ? Date.parse(file.created_at) : NaN;
        return Number.isFinite(created) && created < cutoff;
      })
      .map((file) => `daily/${file.name}`);
    if (expired.length) await supabase.storage.from(BUCKET).remove(expired);
  }

  return { path, bytes: compressed.byteLength, tables: tables.length, createdAt: createdAt.toISOString() };
}

export async function listDatabaseBackups() {
  const supabase = storageAdmin();
  const { data: bucket } = await supabase.storage.getBucket(BUCKET);
  if (!bucket) return [];
  const { data, error } = await supabase.storage.from(BUCKET).list("daily", {
    limit: 100,
    sortBy: { column: "name", order: "desc" },
  });
  if (error) throw new Error(`Could not list backups: ${error.message}`);
  return (data ?? []).map((file) => ({
    name: file.name,
    size: file.metadata?.size ?? null,
    createdAt: file.created_at ?? null,
  }));
}
