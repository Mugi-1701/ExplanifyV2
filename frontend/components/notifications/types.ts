export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_COMPLETED"
  | "MEMBER_ADDED"
  | "ROLE_CHANGED"
  | "PROJECT_CREATED";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  icon: string;
  createdAt: string;
  organizationId: string;
  projectId: string | null;
  userId: string | null;
  actorName: string | null;
};
