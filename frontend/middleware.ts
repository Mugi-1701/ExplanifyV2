import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_PAGES = new Set(["/login", "/register"]);

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/tasks",
  "/projects",
  "/calendar",
  "/settings",
  "/ai-coordination",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("explanify_access_token")?.value;
  const refreshToken = request.cookies.get("explanify_refresh_token")?.value;
  const hasSession = Boolean(accessToken || refreshToken);

  const isAuthPage = AUTH_PAGES.has(pathname);
  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  // Note: During development we rely on a client-side localStorage token
  // check (ProtectedRoute). The server-side middleware previously forced
  // redirects when cookies were missing which conflicted with the
  // simplified localStorage-only auth flow and caused redirect loops.
  // Skip server-side protected-route redirects so the client can decide.

  // Disable all middleware-driven auth redirects for now.
  // Client-side ProtectedRoute will enforce access using localStorage.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
