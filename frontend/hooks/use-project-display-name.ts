"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { getProjectById } from "@/services/project.service";
import { queryKeys } from "@/lib/query-client";
import { useProjects } from "@/hooks/use-projects";

const UNKNOWN_PROJECT_NAME = "Unknown Project";

function useProjectDisplayName(projectId?: string | null) {
  const { projects } = useProjects();

  const cachedProjectName = useMemo(() => {
    if (!projectId) {
      return null;
    }

    return projects.find((project) => project.id === projectId)?.name ?? null;
  }, [projectId, projects]);

  const { data: fetchedProject } = useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: () => getProjectById(projectId ?? ""),
    enabled: Boolean(projectId) && !cachedProjectName,
    staleTime: 120_000,
    gcTime: 1_800_000,
    retry: 1,
  });

  return cachedProjectName ?? fetchedProject?.name ?? UNKNOWN_PROJECT_NAME;
}

export { UNKNOWN_PROJECT_NAME, useProjectDisplayName };
