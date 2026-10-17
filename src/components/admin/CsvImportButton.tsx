"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";

type ImportResult = {
 ok?: boolean;
 created?: number;
 updated?: number;
 skipped?: number;
 errors?: { row: number; message: string }[];
 error?: string;
};

export function CsvImportButton() {
 const inputRef = useRef<HTMLInputElement>(null);
 const [busy, setBusy] = useState(false);
 const [result, setResult] = useState<ImportResult | null>(null);

 async function onFile(file: File | undefined) {
 if (!file) return;
 setBusy(true);
 setResult(null);
 try {
 const form = new FormData();
 form.append("file", file);
 const res = await fetch("/api/admin/products/import", { method: "POST", body: form });
 const data = (await res.json().catch(() => ({}))) as ImportResult;
 setResult(!res.ok && data.error ? data : { ...data, error: !res.ok ? data.error ?? "Import failed." : undefined });
 } catch {
 setResult({ error: "Import failed. Try again." });
 } finally {
 setBusy(false);
 if (inputRef.current) inputRef.current.value = "";
 }
 }

 return (
 <div className="flex flex-wrap items-center gap-2">
 <button
 type="button"
 onClick={() => inputRef.current?.click()}
 disabled={busy}
 className="flex items-center gap-1.5 rounded-zed border border-edge bg-white px-4 py-2.5 text-sm font-semibold text-[#07111F] hover:border-soft-sage disabled:opacity-60"
 >
 <Upload className="size-4" />
 {busy ? "Importing..." : "Import CSV"}
 </button>
 <input
 ref={inputRef}
 type="file"
 accept=".csv,text/csv"
 className="sr-only"
 onChange={(e) => onFile(e.target.files?.[0])}
 />
 {result && (
 <div className="flex flex-col gap-1 text-sm">
 {result.error ? (
 <p className="text-red-600">{result.error}</p>
 ) : (
 <p className="text-[#334155]">
 Imported: <strong>{result.created ?? 0}</strong> created, <strong>{result.updated ?? 0}</strong> updated
 {result.skipped ? `, ${result.skipped} skipped` : ""}
 {result.errors && result.errors.length > 0 && (
 <span className="text-red-600"> ({result.errors.length} error{result.errors.length === 1 ? "" : "s"})</span>
 )}
 </p>
 )}
 {result.errors && result.errors.length > 0 && (
 <details className="text-xs text-red-600">
 <summary className="cursor-pointer">Show errors</summary>
 <ul className="mt-1 max-h-32 space-y-0.5 overflow-auto">
 {result.errors.slice(0, 20).map((e) => (
 <li key={e.row}>Row {e.row}: {e.message}</li>
 ))}
 </ul>
 </details>
 )}
 </div>
 )}
 </div>
 );
}
