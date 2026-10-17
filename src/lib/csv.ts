/**
 * Minimal RFC-4180 CSV helpers (no dependency). Handles quoted fields,
 * escaped quotes, CRLF and embedded newlines/commas.
 */
export function parseCsv(text: string): string[][] {
 const src = text.replace(/^\uFEFF/, "");
 const rows: string[][] = [];
 let row: string[] = [];
 let field = "";
 let inQuotes = false;

 for (let i = 0; i < src.length; i++) {
 const ch = src[i];
 if (inQuotes) {
 if (ch === '"') {
 if (src[i + 1] === '"') {
 field += '"';
 i += 1;
 } else {
 inQuotes = false;
 }
 } else {
 field += ch;
 }
 continue;
 }
 if (ch === '"') {
 inQuotes = true;
 } else if (ch === ",") {
 row.push(field);
 field = "";
 } else if (ch === "\r") {
 // Swallow CR; LF below terminates the row.
 } else if (ch === "\n") {
 row.push(field);
 rows.push(row);
 row = [];
 field = "";
 } else {
 field += ch;
 }
 }
 if (field !== "" || row.length > 0) {
 row.push(field);
 rows.push(row);
 }

 return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export function escapeCsv(value: string | number | null | undefined): string {
 const s = value == null ? "" : String(value);
 if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
 return s;
}
