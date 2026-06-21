export type EventType =
  | "PROJECT_CREATED"
  | "PROJECT_UPDATED"
  | "TASK_CREATED"
  | "TASK_UPDATED"
  | "TASK_COMPLETED"
  | "TASK_DELETED"
  | "TASK_ASSIGNED"
  | "MEMBER_ADDED"
  | "MEMBER_REMOVED";

export type EventMetadata = Record<string, unknown>;

export type EventLog = {
  id: string;
  organizationId: string;
  projectId: string | null;
  userId: string | null;
  eventType: string;
  entityType: string;
  entityId: string;
  metadata: EventMetadata | null;
  createdAt: string;
};

export type TimelineScope = "project" | "organization";
