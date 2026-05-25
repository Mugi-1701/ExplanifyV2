"use client";

import { useState } from "react";
import type React from "react";
import { useRouter } from "next/navigation";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/dashboard/top-navbar";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/query-client";
import * as authService from "@/services/auth.service";

type DashboardShellProps = {
  children: React.ReactNode;
};

function DashboardShell({ children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    try {
      await authService.logout();
      queryClient.clear();
      logout();
      router.replace("/login");
    } catch {
      queryClient.clear();
      logout();
      router.replace("/login");
    }
  }

  return (
    <div className="relative flex min-h-screen overflow-x-hidden bg-[#050816] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.12),transparent_26%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent_24%),linear-gradient(to_bottom,#050816,#050816)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.18]" />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} onLogout={handleLogout} />

      <div className="relative z-10 flex-1 md:pl-72">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="relative min-h-[calc(100vh-80px)]">{children}</main>
      </div>
    </div>
  );
}

export { DashboardShell };
