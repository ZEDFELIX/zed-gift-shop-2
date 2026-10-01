import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Guest checkout means the order status endpoint cannot rely on a session, so
 * it is issued a short-lived signed token when the order is created. Without
 * this, anyone who learns an order id can read its total and M-Pesa receipt.
 */

const SECRET =
process.env.ORDER_TOKEN_SECRET ??
process.env.AUTH_SECRET ??
process.env.NEXTAUTH_SECRET ??
"dev-insecure-order-token-secret";

const TTL_SECONDS = 60 * 60 * 24; // One day: long enough for a slow M-Pesa confirmation.

function sign(payload: string): string {
return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function issueOrderToken(orderId: string, orderNumber: string): string {
const expiresAt = Date.now() + TTL_SECONDS * 1000;
const payload = Buffer.from(JSON.stringify({ orderId, orderNumber, expiresAt })).toString("base64url");
return `${payload}.${sign(payload)}`;
}

export function verifyOrderToken(token: string | null | undefined, orderId: string): boolean {
if (!token) return false;

const [payload, signature] = token.split(".");
if (!payload || !signature) return false;

const expected = sign(payload);
const given = Buffer.from(signature);
const want = Buffer.from(expected);
if (given.length !== want.length || !timingSafeEqual(given, want)) return false;

try {
const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
  orderId?: string;
  expiresAt?: number;
  };
  if (!decoded.orderId || decoded.orderId !== orderId) return false;
  if (typeof decoded.expiresAt !== "number" || decoded.expiresAt < Date.now()) return false;
  return true;
} catch {
  return false;
  }
}