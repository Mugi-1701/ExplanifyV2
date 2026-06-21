import { useQuery } from "@tanstack/react-query";
import type { TimelineScope } from "../types";
import { getEvents } from "../api/events.api";

function eventQueryKey(scope: TimelineScope, id: string | null | undefined) {
  return ["events", scope, id ?? "__missing__"] as const;
}

function useActivityTimeline(scope: TimelineScope, id?: string | null) {
  const query = useQuery({
    queryKey: eventQueryKey(scope, id),
    queryFn: () => {
      if (!id) {
        throw new Error(`${scope} id is required`);
      }

      return getEvents(scope, id);
    },
    enabled: Boolean(id),
    refetchInterval: id ? 10_000 : false,
    refetchIntervalInBackground: true,
  });

  return {
    events: query.data ?? [],
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : query.error ? "Unable to load activity timeline." : null,
    refetch: query.refetch,
  };
}

export { eventQueryKey, useActivityTimeline };
