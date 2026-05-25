"use client";

import type React from "react";

import { DashboardShell } from "@/components/layout/DashboardShell";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

function DashboardLayout({ children }: DashboardLayoutProps) {
  return <DashboardShell>{children}</DashboardShell>;
}

export { DashboardLayout };