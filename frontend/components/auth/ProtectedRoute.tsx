/**
 * Protected route component
 * Redirects unauthenticated users to login
 * Shows loader while checking auth state
 * 
 * CRITICAL: All navigation happens in useEffect, never in render body
 * 
 * Logic:
 * 1. Component mounts → set mounted = true
 * 2. Auth initializes → isLoading false, check isAuthenticated
 * 3. If not authenticated → redirect once (tracked by hasRedirected)
 * 4. If authenticated → render children
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AUTH_TOKEN_KEY, getToken } from "@/lib/token";
import { FullScreenLoader } from "@/components/loaders/FullScreenLoader";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        setMounted(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const token = getToken(AUTH_TOKEN_KEY);

    if (!token) {
      if (process.env.NODE_ENV !== "production") {
        console.debug("[ROUTE] No access token found — redirecting to /login");
      }
      router.replace("/login");
    }
  }, [mounted, router]);

  if (!mounted) {
    return <FullScreenLoader message="Redirecting to login..." />;
  }

  const token = getToken(AUTH_TOKEN_KEY);

  if (!token) {
    return <FullScreenLoader message="Redirecting to login..." />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
