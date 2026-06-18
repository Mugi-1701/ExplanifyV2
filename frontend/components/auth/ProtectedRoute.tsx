/**
 * Protected route component
 * Redirects unauthenticated users to login.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import type React from "react";
import { usePathname, useRouter } from "next/navigation";

import { FullScreenLoader } from "@/components/loaders/FullScreenLoader";
import { AUTH_TOKEN_KEY, getToken } from "@/lib/token";
import { AUTH_EXPIRED_EVENT } from "@/services/api";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  const redirectToLogin = useCallback(() => {
    const next = pathname || "/dashboard";
    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [pathname, router]);

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

    if (!getToken(AUTH_TOKEN_KEY)) {
      redirectToLogin();
    }
  }, [mounted, redirectToLogin]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const handleExpiredSession = () => {
      redirectToLogin();
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpiredSession);

    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpiredSession);
    };
  }, [mounted, redirectToLogin]);

  if (!mounted) {
    return <FullScreenLoader message="Redirecting to login..." />;
  }

  if (!getToken(AUTH_TOKEN_KEY)) {
    return <FullScreenLoader message="Redirecting to login..." />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
