import { QueryClient, keepPreviousData } from "@tanstack/react-query";

const queryDefaults = {
  staleTime: 30_000,
  gcTime: 300_000,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
  retry: 1,
} as const;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: queryDefaults,
  },
});

const queryKeys = {
  projects: ["projects"] as const,
  tasks: (projectId: string | null | undefined) => ["tasks", projectId ?? "__active__"] as const,
  task: (taskId: string) => ["task", taskId] as const,
};

export { keepPreviousData, queryClient, queryDefaults, queryKeys };
