import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/constants";
import { setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

function loginError() {
  return NextResponse.redirect(new URL("/login?auth=google_failed", SITE.url));
}

function safeNext(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/account";
  return value;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  if (url.searchParams.has("error")) return loginError();

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const jar = req.cookies;
  const expectedState = jar.get("zed_google_state")?.value;
  const verifier = jar.get("zed_google_verifier")?.value;
  const next = safeNext(jar.get("zed_google_next")?.value);

  const response = async (target: string) => {
    const result = NextResponse.redirect(new URL(target, SITE.url));
    for (const name of ["zed_google_state", "zed_google_verifier", "zed_google_next"]) {
      result.cookies.set(name, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
    }
    return result;
  };

  if (!code || !state || !expectedState || state !== expectedState || !verifier) {
    return response("/login?auth=google_failed");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return response("/login?auth=google_not_configured");

  const redirectUri = `${SITE.url}/api/auth/google/callback`;
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      cache: "no-store",
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code_verifier: verifier,
      }),
    });
    if (!tokenResponse.ok) return response("/login?auth=google_failed");
    const tokens = await tokenResponse.json() as { access_token?: string };
    if (!tokens.access_token) return response("/login?auth=google_failed");

    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      cache: "no-store",
    });
    if (!profileResponse.ok) return response("/login?auth=google_failed");
    const profile = await profileResponse.json() as {
      sub?: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
      picture?: string;
    };
    if (!profile.sub || !profile.email || profile.email_verified !== true) {
      return response("/login?auth=google_failed");
    }

    const email = profile.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.status !== "ACTIVE") {
      return response("/login?auth=google_failed");
    }

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: { emailVerified: existing.emailVerified ?? new Date() },
        })
      : await prisma.user.create({
          data: {
            name: profile.name?.trim() || email.split("@")[0],
            email,
            emailVerified: new Date(),
            avatarUrl: profile.picture || null,
            role: "CUSTOMER",
            status: "ACTIVE",
          },
        });

    await setSessionCookie({
      sub: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    });
    return response(next);
  } catch (error) {
    console.error("[auth/google] sign-in failed", error instanceof Error ? error.message : "Unknown error");
    return response("/login?auth=google_failed");
  }
}
