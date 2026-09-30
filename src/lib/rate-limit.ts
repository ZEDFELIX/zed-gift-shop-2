import "server-only";

type Window = { count: number; resetAt: number };

const buckets = new Map<string, Window>();

function prune(now: number) {
 if (buckets.size < 2000) return;
 for (const [k, w] of buckets) {
 if (w.resetAt <= now) buckets.delete(k);
 }
}

export async function rateLimit(key: string, opts: { limit: number; windowSeconds: number }): Promise<{
 ok: boolean;
 remaining: number;
 retryAfterSeconds: number;
}> {
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
 mpesaPush: { limit: 6, windowSeconds: 600 },
 contact: { limit: 5, windowSeconds: 3600 },
 checkout: { limit: 12, windowSeconds: 600 },
} as const;