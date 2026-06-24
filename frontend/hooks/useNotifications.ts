"use client";

import { useQuery } from "@tanstack/react-query";

import { queryDefaults } from "@/lib/query-client";
import api from "@/services/api";
import type { NotificationItem } from "@/components/notifications/types";

const notificationsQueryKey = ["notifications", "preview"] as const;

type NotificationsResponse = {
  data: NotificationItem[];
  unreadCount: number;
};

function useNotifications() {
  const query = useQuery({
    queryKey: notificationsQueryKey,
    queryFn: async () => {
      const response = await api.get<NotificationsResponse>("/notifications");
      return response.data;
    },
    staleTime: queryDefaults.staleTime,
    gcTime: queryDefaults.gcTime,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 1,
  });

  return {
    data: query.data,
    notifications: query.data?.data ?? [],
    unreadCount: query.data?.unreadCount ?? 0,
    isLoading: query.isPending,
    isFetching: query.isFetching,
    error: query.error instanceof Error ? query.error : null,
    refetch: query.refetch,
    queryClientKey: notificationsQueryKey,
  };
}

export { notificationsQueryKey, useNotifications };
