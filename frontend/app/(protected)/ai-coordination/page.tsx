"use client";

import { AiCoordinationPage } from "@/components/ai-coordination/ai-coordination-page";
import { useActiveProjectId } from "@/hooks/use-active-project-id";

export default function AICoordinationRoute() {
  const activeProjectId = useActiveProjectId();

  return <AiCoordinationPage projectId={activeProjectId ?? undefined} />;
}
