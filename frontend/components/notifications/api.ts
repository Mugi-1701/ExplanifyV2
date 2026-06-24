import api from "@/services/api";
import type { NotificationItem } from "./types";

type NotificationsResponse = {
  data: NotificationItem[];
  unreadCount: number;
};

async function getNotifications() {
  const response = await api.get<NotificationsResponse>("/notifications");
  return {
    notifications: response.data.data ?? [],
    unreadCount: response.data.unreadCount ?? 0,
  };
}

async function markAllNotificationsRead() {
  const response = await api.patch<{ data: { unreadCount: number } }>("/notifications/read");
  return response.data.data?.unreadCount ?? 0;
}

export { getNotifications, markAllNotificationsRead };
