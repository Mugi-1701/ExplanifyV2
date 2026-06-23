import { api } from "@/lib/api";
import { ACTIVE_PROJECT_KEY, readStoredValue } from "@/lib/storage";
import type { CreateTaskInput, ScheduleTaskInput, Task, TasksResponse, UpdateTaskInput } from "@/types/task";

function unwrapTaskResponse(responseData: unknown): Task[] {
  if (Array.isArray(responseData)) {
    return responseData as Task[];
  }

  if (responseData && typeof responseData === "object" && "data" in responseData) {
    const data = (responseData as { data?: Task | Task[] }).data;
    return Array.isArray(data) ? data : data ? [data] : [];
  }

  return [];
}

function resolveProjectId(projectId?: string) {
  if (projectId) {
    return projectId;
  }

  if (typeof window !== "undefined") {
    return readStoredValue(ACTIVE_PROJECT_KEY) ?? undefined;
  }

  return undefined;
}

function normalizePriority(priority?: string | null): CreateTaskInput["priority"] | undefined {
  if (priority === "URGENT") {
    return "CRITICAL";
  }

  if (priority === "LOW" || priority === "MEDIUM" || priority === "HIGH" || priority === "CRITICAL") {
    return priority;
  }

  return undefined;
}

async function getTasks(projectId?: string): Promise<TasksResponse> {
  const resolvedProjectId = resolveProjectId(projectId);

  if (!resolvedProjectId) {
    return [];
  }

  const { data } = await api.get<Task[]>("/tasks", {
    params: {
      projectId: resolvedProjectId,
    },
  });

  return unwrapTaskResponse(data);
}

async function getTaskById(taskId: string): Promise<Task> {
  if (!taskId) {
    throw new Error("taskId is required");
  }

  const { data } = await api.get<Task>(`/tasks/${taskId}`);
  return data;
}

async function createTask(input: CreateTaskInput): Promise<Task> {
  const resolvedProjectId = resolveProjectId(input.projectId);

  if (!resolvedProjectId) {
    throw new Error("projectId is required");
  }

  const payload: CreateTaskInput = {
    ...input,
    projectId: resolvedProjectId,
    priority: normalizePriority(input.priority),
  };

  // TEMP DEBUG: task create request payload.
  // eslint-disable-next-line no-console
  console.log("[tasks.create] request payload", payload);

  const { data } = await api.post<Task>("/tasks", payload);
  const [task] = unwrapTaskResponse(data);
  return task ?? data;
}

async function updateTask(taskId: string, input: UpdateTaskInput): Promise<Task> {
  if (!taskId) {
    throw new Error("taskId is required");
  }

  const payload: UpdateTaskInput = {
    ...input,
    priority: normalizePriority(input.priority),
  };

  // TEMP DEBUG: task update request payload.
  // eslint-disable-next-line no-console
  console.log("[tasks.update] request payload", payload);

  const { data } = await api.patch<Task>(`/tasks/${taskId}`, payload);
  const [task] = unwrapTaskResponse(data);
  return task ?? data;
}

async function deleteTask(taskId: string): Promise<void> {
  if (!taskId) {
    throw new Error("taskId is required");
  }

  await api.delete(`/tasks/${taskId}`);
}

async function scheduleTask(taskId: string, input: ScheduleTaskInput): Promise<{ task: Task; calendarEvent: NonNullable<Task["calendarEvent"]> }> {
  if (!taskId) {
    throw new Error("taskId is required");
  }

  const { data } = await api.post(`/tasks/${taskId}/schedule`, input);
  const payload = data && typeof data === "object" && "task" in data ? (data as { task?: Task; calendarEvent?: NonNullable<Task["calendarEvent"]> }) : null;
  if (!payload?.task || !payload.calendarEvent) {
    throw new Error("Failed to schedule task");
  }

  return { task: payload.task, calendarEvent: payload.calendarEvent };
}

export { createTask, deleteTask, getTasks, getTaskById, resolveProjectId, scheduleTask, updateTask };
