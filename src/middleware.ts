import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function redirectWithCookies(req: NextRequest, destination: URL, response: NextResponse) {
  const redirect = NextResponse.redirect(destination);
  for (const cookie of response.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  return redirect;
}

function redirectToLogin(req: NextRequest, response: NextResponse) {
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
  return redirectWithCookies(req, loginUrl, response);
}

function redirectToHome(req: NextRequest, response: NextResponse) {
  return redirectWithCookies(req, new URL("/", req.url), response);
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const API_ORIGINS = new Set(
  (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
);

function csrfRejected(req: NextRequest): boolean {
  if (SAFE_METHODS.has(req.method)) return false;
  const origin = req.headers.get("origin");
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

  const path = req.nextUrl.pathname;
  if (path.endsWith("/callback") || path.includes("/webhook")) return false;
  return true;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api") && csrfRejected(req)) {
    return NextResponse.json({ error: "Cross-site request blocked." }, { status: 403 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    // Fail closed for protected pages if authentication is not configured.
    if (pathname.startsWith("/admin") || pathname.startsWith("/account")) {
      return redirectToLogin(req, NextResponse.next({ request: req }));
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request: req });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) req.cookies.set(name, value);
        response = NextResponse.next({ request: req });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  const sessionUser = !error && user ? user : null;
  const role = sessionUser?.app_metadata?.role;
  const isStaff = role === "ADMIN" || role === "STAFF";

  if (pathname.startsWith("/admin")) {
    if (!sessionUser) return redirectToLogin(req, response);
    if (!isStaff) return redirectToHome(req, response);
  }

  if (pathname.startsWith("/account") && !sessionUser) {
    return redirectToLogin(req, response);
  }

  return response;
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*", "/api/:path*"],
};
