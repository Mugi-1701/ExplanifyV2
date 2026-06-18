"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { keepPreviousData, queryDefaults, queryKeys } from "@/lib/query-client";
import { getTasks, resolveProjectId } from "@/services/task.service";
import type { Task } from "@/types/task";

type UseTasksState = {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  isFetching: boolean;
  refetch: () => Promise<void>;
};

function useTasks(projectId?: string): UseTasksState {
  const resolvedProjectId = useMemo(() => projectId ?? resolveProjectId() ?? null, [projectId]);

  const tasksQuery = useQuery({
    queryKey: queryKeys.tasks(resolvedProjectId),
    queryFn: async () => getTasks(resolvedProjectId ?? undefined),
    enabled: Boolean(resolvedProjectId),
    staleTime: queryDefaults.staleTime,
    gcTime: queryDefaults.gcTime,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 1,
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
