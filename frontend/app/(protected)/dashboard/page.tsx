"use client";

import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { useActiveProjectId } from "@/hooks/use-active-project-id";

export default function DashboardPage() {
  const activeProjectId = useActiveProjectId();

  return <DashboardContent projectId={activeProjectId ?? undefined} />;
}
