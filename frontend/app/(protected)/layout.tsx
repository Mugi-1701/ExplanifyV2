"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ActiveProjectBootstrap } from "@/components/projects/active-project-bootstrap";

type ProtectedLayoutProps = {
  children: React.ReactNode;
};

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <ProtectedRoute>
      <ActiveProjectBootstrap />
      <DashboardShell>{children}</DashboardShell>
    </ProtectedRoute>
  );
}
