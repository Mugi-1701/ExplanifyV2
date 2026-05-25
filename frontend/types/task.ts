export type TaskStatus = "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE" | "IN_REVIEW" | "CANCELED";

export type BlockingTask = {
  id: string;
  title: string;
  status: string;
};

export type TaskDependency = {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  dependsOnTask?: BlockingTask | null;
};

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority?: string | null;
  projectId?: string | null;
  organizationId?: string | null;
  assigneeId?: string | null;
  isBlocked?: boolean;
  blockingTasks?: BlockingTask[];
  coordinationReason?: string;
  coordinationState?: "BLOCKED" | "READY" | "ACTIVE" | "DONE";
  dependencies?: TaskDependency[];
  createdAt?: string;
  updatedAt?: string;
};

export type TasksResponse = Task[];

export type CreateTaskInput = {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  projectId: string;
  assigneeId?: string;
  estimateHours?: number;
  startDate?: string;
  dueDate?: string;
};

export type UpdateTaskInput = Partial<CreateTaskInput> & {
  status?: TaskStatus;
};