"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { FullScreenLoader } from "@/components/loaders/FullScreenLoader";

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
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

    if (!isLoading && !isAuthenticated) {
      // preserve destination
      const redirect = pathname || "/dashboard";
      router.replace(`/login?next=${encodeURIComponent(redirect)}`);
    }
  }, [mounted, isAuthenticated, isLoading, router, pathname]);

  useEffect(() => {
    if (mounted && !isLoading) {
      if (process.env.NODE_ENV !== "production") {
        console.debug(isAuthenticated ? "VERIFY SUCCESS" : "VERIFY FAILED");
      }
    }
  }, [mounted, isAuthenticated, isLoading]);

  if (!mounted) {
    return <FullScreenLoader message="Verifying access..." />;
  }

  if (isLoading) {
    return <FullScreenLoader message="Verifying access..." />;
  }

  if (!isAuthenticated) {
    return <FullScreenLoader message="Redirecting to login..." />;
  }

  return <>{children}</>;
};

export default AuthGuard;
