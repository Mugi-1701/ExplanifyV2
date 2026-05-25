export type CoordinationTask = {
  id: string;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE";
  blockingTasks?: Array<{
    id: string;
    title: string;
    status: string;
  }>;
  coordinationReason?: string;
  isBlocked?: boolean;
};
