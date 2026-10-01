import "server-only";

/**
 * Minimal structured logger.
 *
 * Emits one JSON line per event so a log aggregator can index by `event`,
 * `requestId` and `userId`, and redacts obvious secrets/PII so credentials and
 * customer contact details never reach the logs.
 */

type Level = "debug" | "info" | "warn" | "error";

type Fields = Record<string, unknown>;

const REDACT_KEYS = [
  "password",
  "passwordhash",
  "token",
  "secret",
  "apikey",
  "authorization",
  "cookie",
  "mpesareceipt",
  "rawcallback",
  "phone",
  "email",
];

function shouldRedact(key: string): boolean {
  const lower = key.toLowerCase();
  return REDACT_KEYS.some((k) => lower.includes(k));
}

function redact(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[truncated]";
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => redact(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = shouldRedact(k) ? "[redacted]" : redact(v, depth + 1);
  }
  return out;
}

function write(level: Level, event: string, fields?: Fields) {
  const line = JSON.stringify({
    level,
    event,
    ts: new Date().toISOString(),
    ...(fields ? (redact(fields) as Fields) : {}),
  });

  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (event: string, fields?: Fields) => {
    if (process.env.NODE_ENV !== "production") write("debug", event, fields);
  },
  info: (event: string, fields?: Fields) => write("info", event, fields),
  warn: (event: string, fields?: Fields) => write("warn", event, fields),
  error: (event: string, fields?: Fields) => write("error", event, fields),
};