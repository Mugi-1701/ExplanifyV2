import { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import * as taskService from "@/services/task.service";
import type { Task, TaskStatus } from "@/types/task";

export type TransitionAction =
  | "START_TASK"
  | "KEEP_WORKING"
  | "MOVE_TO_REVIEW"
  | "MARK_COMPLETE"
  | "PAUSE_TASK"
  | "RESUME"
  | "IGNORE"
  | "ARCHIVE";

type TransitionParams = {
  queryClient: QueryClient;
  projectId: string | null | undefined;
  taskId: string;
  action: TransitionAction;
};

/**
 * Centralized transition function for task status changes.
 * Performs optimistic cache update, backend update, and query invalidation.
 */
export async function transitionTask({ queryClient, projectId, taskId, action }: TransitionParams) {
  if (!projectId) throw new Error("projectId is required");

  const current = queryClient.getQueryData<Task[]>(queryKeys.tasks(projectId)) ?? [];
  const task = current.find((t) => t.id === taskId);
  if (!task) {
    throw new Error("Task not found in cache");
  }

  let newStatus: TaskStatus | undefined = undefined;
  let backendPayload: any = {};

  switch (action) {
    case "START_TASK":
      newStatus = "IN_PROGRESS" as TaskStatus;
      backendPayload = { status: newStatus };
      break;
    case "KEEP_WORKING":
      // No status change; consumer may update interaction trackers separately
      return { action, newStatus: task.status };
    case "MOVE_TO_REVIEW":
      newStatus = "IN_REVIEW" as TaskStatus;
      backendPayload = { status: newStatus };
      break;
    case "MARK_COMPLETE":
      newStatus = "DONE" as TaskStatus;
      backendPayload = { status: newStatus };
      break;
    case "PAUSE_TASK":
      newStatus = "TODO" as TaskStatus;
      backendPayload = { status: newStatus };
      break;
    case "RESUME":
      // Resume should move the task back into IN_PROGRESS unless dependencies
      // are still incomplete, in which case it should be BLOCKED.
      // Inspect task dependencies from the cached task object.
      const depsIncomplete =
        task.dependencies &&
        task.dependencies.length > 0 &&
        task.dependencies.some((dep) => dep.dependsOnTask?.status !== "DONE");

      if (depsIncomplete) {
        newStatus = "BLOCKED" as TaskStatus;
      } else {
        newStatus = "IN_PROGRESS" as TaskStatus;
      }
      backendPayload = { status: newStatus };
      break;
    case "ARCHIVE":
      newStatus = "ARCHIVED" as TaskStatus;
      backendPayload = { status: newStatus };
      break;
    case "IGNORE":
      // No backend change
      return { action, newStatus: task.status };
    default:
      throw new Error(`Unsupported action ${action}`);
  }

  // Optimistically update cache
  queryClient.setQueryData<Task[]>(queryKeys.tasks(projectId), (items = []) =>
    items.map((t) => (t.id === taskId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t))
  );

  try {
    // eslint-disable-next-line no-console
    console.log("[perf] mutation started: transitionTask", { action, taskId, projectId });
    await taskService.updateTask(taskId, backendPayload);
    // eslint-disable-next-line no-console
    console.log("[perf] mutation finished: transitionTask", { action, taskId, projectId });
    return { action, newStatus };
  } catch (err) {
    queryClient.setQueryData<Task[]>(queryKeys.tasks(projectId), current);
    throw err;
  }
}

export default transitionTask;
