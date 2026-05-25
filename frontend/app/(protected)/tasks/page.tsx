"use client";

import { TasksPage as TasksPageContent } from "@/components/tasks/tasks-page";
import { useActiveProjectId } from "@/hooks/use-active-project-id";

export default function TasksPage() {
  const activeProjectId = useActiveProjectId();

  return <TasksPageContent projectId={activeProjectId ?? undefined} />;
}
