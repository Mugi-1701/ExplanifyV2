export type TaskStatus = "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE" | "IN_REVIEW" | "CANCELED" | "ARCHIVED";

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

export type CoordinationSuggestionPayload = {
  signal: string;
  taskId: string;
  taskTitle: string;
  reason: string;
  completedDependencyTitle?: string;
  blockingTaskCount?: number;
  priority?: string;
};

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  requiredSkills?: string[];
  status: TaskStatus;
  priority?: string | null;
  dueDate?: string | null;
  estimateHours?: number | null;
  projectId?: string | null;
  organizationId?: string | null;
  assigneeId?: string | null;
  aiRecommendedUserId?: string | null;
  aiRecommendationScore?: number | null;
  aiRecommendationConfidence?: "LOW" | "MEDIUM" | "HIGH" | null;
  aiRecommendationExplanation?: string[] | null;
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
  isBlocked?: boolean;
  blockingTasks?: BlockingTask[];
  coordinationReason?: string;
  coordinationState?: "BLOCKED" | "READY" | "ACTIVE" | "COMPLETED" | "DONE";
  dependencies?: TaskDependency[];
  coordinationSuggestions?: CoordinationSuggestionPayload[];
  calendarEvent?: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    taskId?: string | null;
    userId?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
};

export type TasksResponse = Task[];

export type CreateTaskInput = {
  title: string;
  description?: string;
  requiredSkills?: string[];
  status?: TaskStatus;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  projectId: string;
  assigneeId?: string;
  aiRecommendedUserId?: string | null;
  aiRecommendationScore?: number | null;
  aiRecommendationConfidence?: "LOW" | "MEDIUM" | "HIGH" | null;
  aiRecommendationExplanation?: string[] | null;
  estimateHours?: number;
  startDate?: string;
  dueDate?: string;
  dependsOnTaskId?: string;
};

export type UpdateTaskInput = Partial<CreateTaskInput> & {
  status?: TaskStatus;
  coordinationState?: "BLOCKED" | "READY" | "ACTIVE" | "COMPLETED" | "DONE";
};

export type ScheduleTaskInput = {
  date: string;
  startTime: string;
  durationMinutes: number;
  title?: string;
  description?: string | null;
};
