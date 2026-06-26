"use client";

import { useParams } from "next/navigation";

import { KanbanPage as KanbanPageContent } from "@/components/kanban/KanbanPage";

export default function ProjectKanbanRoutePage() {
  const params = useParams<{ projectId?: string | string[] }>();
  const projectId = Array.isArray(params?.projectId) ? params.projectId[0] : params?.projectId;

  return <KanbanPageContent projectId={projectId ?? undefined} />;
}
