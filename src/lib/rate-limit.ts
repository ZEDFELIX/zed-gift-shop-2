import "server-only";

type Window = { count: number; resetAt: number };

const buckets = new Map<string, Window>();

function prune(now: number) {
 if (buckets.size < 2000) return;
 for (const [k, w] of buckets) {
 if (w.resetAt <= now) buckets.delete(k);
 }
}

async function redisRateLimit(key: string, opts: { limit: number; windowSeconds: number }) {
 const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
 const token = process.env.UPSTASH_REDIS_REST_TOKEN;
 if (!url || !token) return null;

 // Atomic fixed-window counter shared by all serverless instances.
 const script = 'local count = redis.call("INCR", KEYS[1]); if count == 1 then redis.call("EXPIRE", KEYS[1], ARGV[1]); end; local ttl = redis.call("TTL", KEYS[1]); return {count, ttl};';
 const response = await fetch(url, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify(["EVAL", script, "1", `zed:rate:${key}`, String(opts.windowSeconds)]),
  cache: "no-store",
 });
 const data = await response.json() as { result?: [number, number]; error?: string };
 if (!response.ok || data.error || !Array.isArray(data.result)) {
  throw new Error("Shared rate-limit service returned an invalid response.");
 }
 const count = Number(data.result[0]);
 const ttl = Number(data.result[1]);
 return {
  ok: count <= opts.limit,
  remaining: Math.max(0, opts.limit - count),
  retryAfterSeconds: count <= opts.limit ? 0 : Math.max(1, ttl),
 };
}

export async function rateLimit(key: string, opts: { limit: number; windowSeconds: number }): Promise<{
 ok: boolean;
 remaining: number;
 retryAfterSeconds: number;
}> {
 try {
  const shared = await redisRateLimit(key, opts);
  if (shared) return shared;
 } catch (error) {
  // Keep the shop available during a Redis outage, with a local fallback.
  console.error("[rate-limit] shared store unavailable; using local fallback.", error instanceof Error ? error.message : "Unknown error");
 }

 const now = Date.now();
 prune(now);

 const bucket = buckets.get(key);
 if (!bucket || bucket.resetAt <= now) {
 buckets.set(key, { count: 1, resetAt: now + opts.windowSeconds * 1000 });
 return { ok: true, remaining: opts.limit - 1, retryAfterSeconds: 0 };
 }

 if (bucket.count >= opts.limit) {
 return {
 ok: false,
 remaining: 0,
 retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
 };
 }

 bucket.count += 1;
 return { ok: true, remaining: Math.max(0, opts.limit - bucket.count), retryAfterSeconds: 0 };
}

export const RATE_LIMITS = {
  smsOtp: { limit: 5, windowSeconds: 300 },
  login: { limit: 8, windowSeconds: 300 },
  register: { limit: 5, windowSeconds: 3600 },
  mpesaPush: { limit: 6, windowSeconds: 600 },
  contact: { limit: 5, windowSeconds: 3600 },
  passwordReset: { limit: 10, windowSeconds: 300 },
  checkout: { limit: 12, windowSeconds: 600 },
  reviewSubmit: { limit: 5, windowSeconds: 3600 },
  reviewHelpful: { limit: 30, windowSeconds: 600 },
  reviewReport: { limit: 10, windowSeconds: 3600 },
} as const;