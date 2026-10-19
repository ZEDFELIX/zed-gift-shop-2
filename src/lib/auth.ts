import "server-only";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { COOKIE_KEYS } from "@/lib/constants";
import { generateBackupCodes, generateTotpSecret, hashBackupCode, verifyTotp } from "@/lib/totp";

const SESSION_COOKIE = COOKIE_KEYS.session;

export type SessionPayload = {
 sub: string;
 role: "CUSTOMER" | "STAFF" | "ADMIN";
 email: string;
 name: string;
 iat?: number;
 exp?: number;
};

function getSecret(): Uint8Array {
 const secret = process.env.AUTH_SECRET;
 if (!secret || secret.length < 8) {
 throw new Error("AUTH_SECRET is not configured. Set it in your environment.");
 }
 return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
 return await new SignJWT({ role: payload.role, email: payload.email, name: payload.name })
 .setProtectedHeader({ alg: "HS256" })
 .setSubject(payload.sub)
 .setIssuedAt()
 .setExpirationTime("30d")
 .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
 try {
 const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
 return {
 sub: payload.sub as string,
 role: payload.role as SessionPayload["role"],
 email: payload.email as string,
 name: payload.name as string,
 };
 } catch {
 return null;
 }
}

export async function getSession(): Promise<SessionPayload | null> {
 const store = await cookies();
 const token = store.get(SESSION_COOKIE)?.value;
 if (!token) return null;
 return verifySessionToken(token);
}

export async function setSessionCookie(payload: SessionPayload) {
 const store = await cookies();
 const token = await signSession(payload);
 store.set(SESSION_COOKIE, token, {
 httpOnly: true,
 secure: process.env.NODE_ENV === "production",
 sameSite: "lax",
 path: "/",
 maxAge: 60 * 60 * 24 * 30,
 });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: {
        id: true, name: true, email: true, phone: true, role: true,
        emailVerified: true, createdAt: true,
      },
    });
    return user;
  } catch {
    return null;
  }
}

export async function requireUser() {
 const user = await getCurrentUser();
 if (!user) {
 throw new Error("AUTH_REQUIRED");
 }
 return user;
}

export async function isAdmin() {
 const user = await getCurrentUser();
 return user?.role === "ADMIN" || user?.role === "STAFF";
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
    throw new Error("ADMIN_REQUIRED");
  }
  return user;
}

// ---------- Two-factor authentication (TOTP) ----------

/**
 * Starts setup: generates a secret and a set of one-time backup codes, stores
 * them pending confirmation, and returns the plaintext values so they can be
 * shown to the user exactly once.
 */
export async function beginTwoFactorSetup(userId: string): Promise<{ secret: string; backupCodes: string[] }> {
  const secret = generateTotpSecret();
  const backupCodes = generateBackupCodes(8);
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorPendingSecret: secret,
      twoFactorBackupCodes: backupCodes.map(hashBackupCode),
    },
  });
  return { secret, backupCodes };
}

/** Confirms setup once the user proves they can read a code from their app. */
export async function confirmTwoFactorSetup(userId: string, code: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorPendingSecret: true },
  });
  if (!user?.twoFactorPendingSecret) return false;
  if (!verifyTotp(user.twoFactorPendingSecret, code)) return false;
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: user.twoFactorPendingSecret,
      twoFactorPendingSecret: null,
      twoFactorEnabled: true,
    },
  });
  return true;
}

export async function disableTwoFactor(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: null,
      twoFactorPendingSecret: null,
      twoFactorEnabled: false,
      twoFactorBackupCodes: [],
    },
  });
}

/**
 * Verifies a login code against the user's TOTP secret, falling back to a
 * one-time backup code (which is consumed when used).
 */
export async function verifyTwoFactorLogin(
  user: { id: string; twoFactorSecret: string | null; twoFactorBackupCodes: string[] },
  code: string,
): Promise<boolean> {
  if (!code) return false;
  if (user.twoFactorSecret && verifyTotp(user.twoFactorSecret, code)) return true;

  const hash = hashBackupCode(code);
  if (user.twoFactorBackupCodes.includes(hash)) {
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorBackupCodes: { set: user.twoFactorBackupCodes.filter((c) => c !== hash) } },
    });
    return true;
  }
  return false;
}

export async function hashPassword(password: string): Promise<string> {
 return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
 return bcrypt.compare(password, hash);
}

export async function createPasswordResetToken(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const raw = randomToken();
  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      tokenHash: await hashPassword(raw),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  });
  return raw;
}

export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const resets = await prisma.passwordReset.findMany({
    where: { usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  for (const r of resets) {
    if (await verifyPassword(token, r.tokenHash)) {
      const hash = await hashPassword(newPassword);
      await prisma.$transaction([
        prisma.user.update({ where: { id: r.userId }, data: { passwordHash: hash } }),
        prisma.passwordReset.update({ where: { id: r.id }, data: { usedAt: new Date() } }),
      ]);
      return true;
    }
  }
  return false;
}

function randomToken(): string {
 return [...crypto.getRandomValues(new Uint8Array(24))]
 .map((b) => b.toString(16).padStart(2, "0"))
 .join("");
}