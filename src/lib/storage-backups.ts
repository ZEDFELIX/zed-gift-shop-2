import "server-only";

import { gzipSync, gunzipSync } from "node:zlib";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

const BUCKET = "zed-gift-shop-backups";
const RETENTION_DAYS = 30;

function storageAdmin() {
  // Keep the URL and server key from the same environment-variable family.
  // The generic SUPABASE_URL currently points at a different Supabase project,
  // so prefer the Zed Gift Shop-specific pair to avoid cross-project mismatches.
  const candidates = [
    {
      url: process.env.zedgiftshop_SUPABASE_URL,
      key: process.env.zedgiftshop_SUPABASE_SERVICE_ROLE_KEY,
    },
    {
      url: process.env.NEXT_PUBLIC_zedgiftshop_SUPABASE_URL,
      key: process.env.zedgiftshop_SUPABASE_SERVICE_ROLE_KEY,
    },
    {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      key: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    {
      url: process.env.SUPABASE_URL,
      key: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    {
      url: process.env.SUPABASE_URL,
      key: process.env.SUPABASE_SECRET_KEY,
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

  if (!config?.url || !config.key) {
    throw new Error("No matching Supabase project URL and server-side storage key are configured.");
  }

  return createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
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
  const { data: existingBucket, error: bucketLookupError } = await supabase.storage.getBucket(BUCKET);
  if (!existingBucket) {
    if (bucketLookupError && String(bucketLookupError.statusCode) !== "404") {
      throw new Error(`Could not access backup bucket: ${bucketLookupError.message}`);
    }
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

/**
 * Non-destructive recovery preflight: download and decompress one private
 * snapshot, then validate its format and table/row structure without touching
 * the live database.
 */
export async function verifyDatabaseBackup(name: string) {
  if (!/^[A-Za-z0-9T._-]+\.json\.gz$/.test(name)) {
    throw new Error("Invalid backup filename.");
  }

  const supabase = storageAdmin();
  const path = `daily/${name}`;
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) throw new Error(`Could not download backup for verification: ${error?.message ?? "File not found"}`);

  const compressed = Buffer.from(await data.arrayBuffer());
  if (compressed.byteLength === 0 || compressed.byteLength > 45 * 1024 * 1024) {
    throw new Error("Backup file size is outside the safe verification limit.");
  }

  let parsed: unknown;
  try {
    const json = gunzipSync(compressed, { maxOutputLength: 256 * 1024 * 1024 }).toString("utf8");
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Backup integrity check failed: the compressed file could not be read as valid JSON.");
  }

  if (!parsed || typeof parsed !== "object") throw new Error("Backup integrity check failed: invalid snapshot structure.");
  const snapshot = parsed as { format?: unknown; createdAt?: unknown; tables?: unknown };
  if (snapshot.format !== "zed-gift-shop-database-backup-v1" || !snapshot.tables || typeof snapshot.tables !== "object" || Array.isArray(snapshot.tables)) {
    throw new Error("Backup integrity check failed: unsupported snapshot format.");
  }

  const tables = snapshot.tables as Record<string, unknown>;
  const tableNames = Object.keys(tables);
  if (tableNames.length === 0 || tableNames.some((table) => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(table) || !Array.isArray(tables[table]))) {
    throw new Error("Backup integrity check failed: invalid table data.");
  }

  const rowCount = tableNames.reduce((sum, table) => sum + (tables[table] as unknown[]).length, 0);
  return {
    name,
    valid: true,
    createdAt: typeof snapshot.createdAt === "string" ? snapshot.createdAt : null,
    compressedBytes: compressed.byteLength,
    tableCount: tableNames.length,
    rowCount,
  };
}

export async function listDatabaseBackups() {
  const supabase = storageAdmin();
  const { data: bucket, error: bucketLookupError } = await supabase.storage.getBucket(BUCKET);
  if (!bucket) {
    if (bucketLookupError && String(bucketLookupError.statusCode) !== "404") {
      throw new Error(`Could not access backup bucket: ${bucketLookupError.message}`);
    }
    return [];
  }
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
