const { prisma } = require("../../lib/prisma");
const { AppError } = require("../../utils/AppError");
const taskRepository = require("./task.repository");
const { computeCoordinationState } = require("./utils/getTaskBlockingState");

/**
 * Coordination Signal Types
 * Extensible architecture for future signals (inactivity, GitHub events, deployments, etc.)
 */
const CoordinationSignal = {
  DEPENDENCY_READY: "DEPENDENCY_READY",
  // Future signals can be added here:
  // INACTIVITY_READY: "INACTIVITY_READY",
  // GITHUB_ACTIVITY: "GITHUB_ACTIVITY",
  // DEPLOYMENT_READY: "DEPLOYMENT_READY",
  // CALENDAR_AVAILABLE: "CALENDAR_AVAILABLE",
};

/**
 * Find tasks that become READY after a task status change
 *
 * Extensible signal architecture:
 * This function can be extended to check multiple signals
 * (not just dependency completion)
 */
async function findCoordinationSuggestions(taskId) {
  if (!taskId) {
    throw new AppError("Task ID is required", 400);
  }

  const task = await taskRepository.getTaskById(taskId);
  if (!task) {
    throw new AppError("Task not found", 404);
  }

  const suggestions = [];

  // Signal 1: DEPENDENCY_READY
  // When this task becomes DONE, find dependent tasks that are now unblocked
  if (task.status === "DONE") {
    const dependentSuggestions = await detectDependencyReadySignals(taskId);
    suggestions.push(...dependentSuggestions);
  }

  // Future signals can be added here:
  // if (task.status === "IN_PROGRESS") {
  //   const inactivitySuggestions = await detectInactivityReadySignals(taskId);
  //   suggestions.push(...inactivitySuggestions);
  // }

  return suggestions;
}

/**
 * Detect DEPENDENCY_READY signal
 * When task becomes DONE, find dependent tasks where all dependencies are now complete
 */
async function detectDependencyReadySignals(completedTaskId) {
  // Get tasks that depend on this completed task
  const dependentRelations = await prisma.taskDependency.findMany({
    where: {
      dependsOnTaskId: completedTaskId,
    },
    include: {
      task: {
        include: {
          dependencies: {
            include: {
              dependsOnTask: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const suggestions = [];

  for (const relation of dependentRelations) {
    const dependentTask = relation.task;

    // Skip if already in progress, done, or canceled
    if (["IN_PROGRESS", "DONE", "CANCELED"].includes(dependentTask.status)) {
      continue;
    }

    // Check if ALL dependencies are now complete
    const allDependenciesComplete = dependentTask.dependencies.every(
      (dep) => dep.dependsOnTask.status === "DONE"
    );

    if (allDependenciesComplete && dependentTask.dependencies.length > 0) {
      const blockingTaskTitles = dependentTask.dependencies
        .map((dep) => dep.dependsOnTask.title)
        .join(", ");

      suggestions.push({
        signal: CoordinationSignal.DEPENDENCY_READY,
        taskId: dependentTask.id,
        taskTitle: dependentTask.taskTitle || dependentTask.title,
        reason: `${blockingTaskTitles} ${blockingTaskTitles.includes(",") ? "are" : "is"} now complete.`,
        completedDependencyTitle: (
          await prisma.task.findUnique({
            where: { id: completedTaskId },
            select: { title: true },
          })
        )?.title,
        blockingTaskCount: dependentTask.dependencies.length,
        priority: dependentTask.priority || "MEDIUM",
      });
    }
  }

  return suggestions;
}

/**
 * Get coordination suggestion details for a specific task
 * Used when user confirms "Start Task"
 */
async function getTaskCoordinationDetails(taskId) {
  const task = await taskRepository.getTaskById(taskId);
  if (!task) {
    throw new AppError("Task not found", 404);
  }

  const computed = computeCoordinationState(task);

  return {
    taskId,
    taskTitle: task.title,
    description: task.description,
    priority: task.priority,
    isBlocked: computed.isBlocked,
    blockingTasks: computed.blockingTasks,
    coordinationReason: computed.coordinationReason,
    coordinationState: computed.coordinationState,
  };
}

module.exports = {
  CoordinationSignal,
  findCoordinationSuggestions,
  detectDependencyReadySignals,
  getTaskCoordinationDetails,
};
