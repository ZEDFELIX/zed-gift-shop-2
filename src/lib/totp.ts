import "server-only";

import crypto from "node:crypto";

/**
 * RFC 6238 TOTP, implemented with Node's built-in crypto so admin two-factor
 * authentication needs no third-party package. Secrets are base32 (compatible
 * with Google Authenticator, Authy, 1Password, etc.).
 */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

export function base32Decode(value: string): Buffer {
  const clean = value.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let accumulator = 0;
  const out: number[] = [];
  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx < 0) continue;
    accumulator = (accumulator << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((accumulator >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** 160-bit secret, the same size authenticator apps expect. */
export function generateTotpSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

function hmacSha1(key: Buffer, message: Buffer): Buffer {
  return crypto.createHmac("sha1", key).update(message).digest();
}

export function totpCode(secret: string, at: number = Date.now(), step = 30, digits = 6): string {
  const counter = Math.floor(at / 1000 / step);
  const buffer = Buffer.alloc(8);
  let remaining = counter;
  for (let i = 7; i >= 0; i--) {
    buffer[i] = remaining & 0xff;
    remaining = Math.floor(remaining / 256);
  }
  const hmac = hmacSha1(base32Decode(secret), buffer);
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  const otp = binary % Math.pow(10, digits);
  return otp.toString().padStart(digits, "0");
}

/** Accepts the current code and one step either side to allow clock drift. */
export function verifyTotp(secret: string, code: string): boolean {
  if (!/^\d{6}$/.test(code.trim())) return false;
  const normalized = code.trim();
  const now = Date.now();
  for (const delta of [-30_000, 0, 30_000]) {
    if (totpCode(secret, now + delta) === normalized) return true;
  }
  return false;
}

/** One-time recovery codes, formatted XXXX-XXXX for easy reading. */
export function generateBackupCodes(count = 8): string[] {
  return Array.from({ length: count }, () =>
    crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase()
      .replace(/(.{4})(?=.)/g, "$1-"),
  );
}

export function hashBackupCode(code: string): string {
  return crypto.createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
}
