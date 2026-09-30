import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

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

export async function middleware(req: NextRequest) {
 const { pathname } = req.nextUrl;
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
 matcher: ["/account/:path*", "/admin/:path*"],
};