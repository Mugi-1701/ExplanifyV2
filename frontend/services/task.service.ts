import { api } from "@/lib/api";
import { ACTIVE_PROJECT_KEY, readStoredValue } from "@/lib/storage";
import type { CreateTaskInput, Task, TasksResponse, UpdateTaskInput } from "@/types/task";

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

export { createTask, deleteTask, getTasks, getTaskById, resolveProjectId, updateTask };