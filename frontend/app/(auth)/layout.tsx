/**
 * Public Auth Layout
 * Wraps login and register pages
 */

"use client";

import { PublicRoute } from "@/components/auth/PublicRoute";

type AuthLayoutProps = {
  children: React.ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return <PublicRoute>{children}</PublicRoute>;
}
