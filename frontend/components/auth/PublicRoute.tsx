/**
 * Public route component
 * Redirects authenticated users away from auth pages
 * Shows loader while checking auth state
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { FullScreenLoader } from "@/components/loaders/FullScreenLoader";

type PublicRouteProps = {
  children: React.ReactNode;
};

export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        setIsMounted(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // Immediately redirect authenticated users to dashboard
    // without waiting for isLoading (since our store has isLoading: false by default)
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router, isMounted]);

  // Show loader only if not yet mounted
  if (!isMounted) {
    return <FullScreenLoader message="Loading..." />;
  }

  // Show content only if not authenticated
  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

export default PublicRoute;
