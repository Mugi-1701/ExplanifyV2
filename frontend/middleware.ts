import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  void request;

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
