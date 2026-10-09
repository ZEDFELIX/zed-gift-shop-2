import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose/jwt/verify";

import { COOKIE_KEYS } from "@/lib/constants";

const SESSION_COOKIE = COOKIE_KEYS.session;

async function readSession(req: NextRequest): Promise<{ role: string } | null> {
 const token = req.cookies.get(SESSION_COOKIE)?.value;
 if (!token) return null;
 const secret = process.env.AUTH_SECRET;
 if (!secret || secret.length < 8) return null;
 try {
 const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
 algorithms: ["HS256"],
 });
 return { role: (payload.role as string) ?? "CUSTOMER" };
 } catch {
 return null;
 }
}

function redirectToLogin(req: NextRequest) {
 const loginUrl = new URL("/login", req.url);
 loginUrl.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
 return NextResponse.redirect(loginUrl);
}

function redirectToHome(req: NextRequest) {
 return NextResponse.redirect(new URL("/", req.url));
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const API_ORIGINS = new Set(
 (process.env.ALLOWED_ORIGINS ?? "")
   .split(",")
   .map((o) => o.trim())
   .filter(Boolean),
);

/**
 * Same-origin check for cookie-authenticated state changes.
 *
 * Session cookies are SameSite=Lax, which blocks most cross-site form posts,
 * but this adds defence in depth: a mutating request carrying an Origin that is
 * neither the request host nor an explicitly allowed origin is refused before
 * it reaches any handler.
 */
function csrfRejected(req: NextRequest): boolean {
 if (SAFE_METHODS.has(req.method)) return false;

 const origin = req.headers.get("origin");
 // Non-browser clients (server-to-server, webhooks) omit Origin entirely.
 if (!origin) return false;

 let originHost: string;
 try {
   originHost = new URL(origin).host;
 } catch {
   return true;
 }

 const selfHost = req.headers.get("host");
 if (selfHost && originHost === selfHost) return false;
 if (API_ORIGINS.has(origin)) return false;

 // Provider webhook/callback endpoints authenticate by signature, not cookies.
 const p = req.nextUrl.pathname;
 if (p.endsWith("/callback") || p.includes("/webhook")) return false;

 return true;
}

export async function middleware(req: NextRequest) {
 const { pathname } = req.nextUrl;

 if (pathname.startsWith("/api") && csrfRejected(req)) {
   return NextResponse.json({ error: "Cross-site request blocked." }, { status: 403 });
 }

 const session = await readSession(req);

 if (pathname.startsWith("/admin")) {
 if (!session) return redirectToLogin(req);
 if (session.role !== "ADMIN" && session.role !== "STAFF") return redirectToHome(req);
 return NextResponse.next();
 }

 if (pathname.startsWith("/account")) {
 if (!session) return redirectToLogin(req);
 return NextResponse.next();
 }

 return NextResponse.next();
}

export const config = {
 matcher: ["/account/:path*", "/admin/:path*", "/api/:path*"],
};