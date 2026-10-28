"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Backup = { name: string; size: number | null; createdAt: string | null };

function formatBytes(value: number | null) {
  if (value == null) return "Size unavailable";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
}

export default function AdminBackupsPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const loadBackups = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/backups", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load backups.");
      setBackups(data.backups ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load backups.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadBackups(); }, [loadBackups]);

  async function createBackup() {
    setCreating(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/backups", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Backup failed.");
      setMessage(`Backup created successfully — ${formatBytes(data.backup?.bytes ?? null)} stored privately.`);
      await loadBackups();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Backup failed.");
    } finally {
      setCreating(false);
    }
  }

  async function verifyBackup(name: string) {
    setVerifying(name);
    setMessage("");
    try {
      const response = await fetch("/api/admin/backups/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Backup verification failed.");
      const result = data.verification as { tableCount: number; rowCount: number; compressedBytes: number };
      setMessage(`Backup integrity verified: ${result.tableCount} tables and ${result.rowCount} rows. No live data was changed.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Backup verification failed.");
    } finally {
      setVerifying(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-zed border border-edge bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-soft-sage">Store recovery</p>
            <h1 className="mt-2 font-display text-2xl font-bold text-[#07111F]">Backups & storage</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#475569]">
              Product images stay in Supabase Storage. Orders and catalogue records remain in PostgreSQL.
              Compressed database snapshots are stored in a private bucket and retained for up to 30 days.
            </p>
          </div>
          <button onClick={createBackup} disabled={creating} className="rounded-xl bg-[#173F35] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#24574A] disabled:cursor-not-allowed disabled:opacity-60">
            {creating ? "Creating backup…" : "Create backup now"}
          </button>
        </div>
        {message ? <p role="status" className="mt-4 rounded-lg bg-[#F5F7F5] px-3 py-2 text-sm text-[#334155]">{message}</p> : null}
      </div>

      <div className="rounded-zed border border-edge bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-[#07111F]">Recent backups</h2>
          <button onClick={() => void loadBackups()} disabled={loading} className="text-sm font-semibold text-soft-sage hover:underline disabled:opacity-60">Refresh</button>
        </div>
        {loading ? <p className="py-6 text-sm text-[#64748B]">Loading backups…</p> :
          backups.length ? (
            <div className="mt-4 divide-y divide-[#E8ECE9]">
              {backups.map((backup) => (
                <div key={backup.name} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-all text-sm font-medium text-[#1F2937]">{backup.name}</p>
                    <div className="mt-1 flex flex-wrap gap-4 text-xs text-[#64748B]">
                      <span>{formatBytes(backup.size)}</span>
                      <span>{backup.createdAt ? new Date(backup.createdAt).toLocaleString() : "Date unavailable"}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void verifyBackup(backup.name)}
                    disabled={Boolean(verifying) || creating}
                    className="shrink-0 self-start rounded-lg border border-[#D8E2DC] px-3 py-2 text-xs font-semibold text-[#173F35] transition hover:bg-[#F5F7F5] disabled:cursor-not-allowed disabled:opacity-50 sm:self-center"
                  >
                    {verifying === backup.name ? "Verifying…" : "Verify integrity"}
                  </button>
                </div>
              ))}
            </div>
          ) : <p className="py-6 text-sm text-[#64748B]">No backups yet. Create the first backup to initialize private backup storage.</p>}
      </div>
      <Link href="/admin" className="inline-block text-sm font-semibold text-soft-sage hover:underline">← Back to dashboard</Link>
    </div>
  );
}
