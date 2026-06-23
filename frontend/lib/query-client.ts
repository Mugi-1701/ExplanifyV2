import { QueryClient, keepPreviousData } from "@tanstack/react-query";

const QUERY_STALE_TIME_MS = 120_000;
const QUERY_GC_TIME_MS = 1_800_000;

const queryDefaults = {
  staleTime: QUERY_STALE_TIME_MS,
  gcTime: QUERY_GC_TIME_MS,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
  retry: 1,
} as const;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: queryDefaults,
    mutations: {
      retry: false,
    },
  },
});

const queryKeys = {
  projects: ["projects"] as const,
  project: (projectId: string | null | undefined) => ["project", projectId ?? "__active__"] as const,
  tasks: (projectId: string | null | undefined) => ["tasks", projectId ?? "__active__"] as const,
  task: (taskId: string) => ["task", taskId] as const,
};

export { keepPreviousData, queryClient, queryDefaults, queryKeys };
