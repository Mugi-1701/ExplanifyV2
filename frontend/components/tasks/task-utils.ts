import type { Task } from "@/types/task";

const priorityOrder = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
} as const;

function getPriorityTone(priority?: string | null) {
  switch (priority) {
    case "CRITICAL":
      return "border-rose-400/20 bg-rose-500/10 text-rose-200";
    case "HIGH":
      return "border-orange-400/20 bg-orange-500/10 text-orange-200";
    case "LOW":
      return "border-sky-400/20 bg-sky-500/10 text-sky-200";
    case "MEDIUM":
    default:
      return "border-violet-400/20 bg-violet-500/10 text-violet-100";
  }
}

function getStatusTone(status: Task["status"]) {
  switch (status) {
    case "DONE":
      return "border-emerald-400/20 bg-emerald-500/10 text-emerald-200";
    case "IN_PROGRESS":
      return "border-blue-400/20 bg-blue-500/10 text-blue-200";
    case "BLOCKED":
      return "border-amber-400/20 bg-amber-500/10 text-amber-200";
    case "IN_REVIEW":
      return "border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-200";
    case "TODO":
    default:
      return "border-white/10 bg-white/5 text-white/70";
  }
}

function getTaskHealthLabel(task: Task) {
  if (task.isBlocked) {
    return "Blocked";
  }

  if (task.status === "DONE") {
    return "Completed";
  }

  if (task.status === "IN_PROGRESS") {
    return "Active";
  }

  return "Ready";
}

function sortTasksByPriority(tasks: Task[]) {
  return [...tasks].sort((left, right) => {
    const leftValue = priorityOrder[(left.priority as keyof typeof priorityOrder) || "MEDIUM"] ?? 2;
    const rightValue = priorityOrder[(right.priority as keyof typeof priorityOrder) || "MEDIUM"] ?? 2;

    if (left.isBlocked !== right.isBlocked) {
      return left.isBlocked ? -1 : 1;
    }

    if (rightValue !== leftValue) {
      return rightValue - leftValue;
    }

    return (right.updatedAt ?? "").localeCompare(left.updatedAt ?? "");
  });
}

function getTaskDependencyNodes(task: Task) {
  if (task.blockingTasks && task.blockingTasks.length > 0) {
    return task.blockingTasks;
  }

  return (
    task.dependencies
      ?.map((dependency) => dependency.dependsOnTask)
      .filter((dependency): dependency is NonNullable<typeof dependency> => Boolean(dependency)) ?? []
  );
}

export { getPriorityTone, getStatusTone, getTaskDependencyNodes, getTaskHealthLabel, sortTasksByPriority };