"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { keepPreviousData, queryKeys } from "@/lib/query-client";
import { getTasks, resolveProjectId } from "@/services/task.service";
import type { Task } from "@/types/task";

type UseTasksState = {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  isFetching: boolean;
  refetch: () => Promise<void>;
};

const TASKS_STALE_TIME_MS = 30000;
const TASKS_GC_TIME_MS = 300000;

function useTasks(projectId?: string): UseTasksState {
  const resolvedProjectId = useMemo(() => projectId ?? resolveProjectId() ?? null, [projectId]);

  const tasksQuery = useQuery({
    queryKey: queryKeys.tasks(resolvedProjectId),
    queryFn: async () => getTasks(resolvedProjectId ?? undefined),
    enabled: Boolean(resolvedProjectId),
    staleTime: TASKS_STALE_TIME_MS,
    gcTime: TASKS_GC_TIME_MS,
    placeholderData: keepPreviousData,
  });

  return {
    tasks: tasksQuery.data ?? [],
    loading: tasksQuery.isPending && (tasksQuery.data ?? []).length === 0,
    error: tasksQuery.error instanceof Error ? tasksQuery.error.message : null,
    isFetching: tasksQuery.isFetching,
    refetch: async () => {
      await tasksQuery.refetch();
    },
  };
}

export { useTasks };
