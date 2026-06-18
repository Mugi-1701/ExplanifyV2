const { AppError } = require("../../utils/AppError");
const taskRepository = require("./task.repository");
const { prisma } = require("../../lib/prisma");
const { computeCoordinationState, getTaskBlockingState } = require("./utils/getTaskBlockingState");
const coordinationService = require("./coordination.service");

/**
 * Recalculate blocked state for a single task and persist status changes
 */
async function recalcAndPersistBlockedState(taskId) {
  if (!taskId) {
    throw new AppError("Task ID is required", 400);
  }

  const task = await taskRepository.getTaskById(taskId);
  if (!task) {
    throw new AppError("Task not found", 404);
  }

  const { isBlocked } = getTaskBlockingState(task);

  if (isBlocked && task.status !== "BLOCKED") {
    await taskRepository.updateTask(taskId, { status: "BLOCKED" });
  } else if (!isBlocked && task.status === "BLOCKED") {
    // revert to TODO when unblocked
    await taskRepository.updateTask(taskId, { status: "TODO" });
  }

  return { isBlocked };
}

/**
 * CREATE TASK
 */
async function createTask(orgId, userId, data) {
  console.log("[taskService.createTask] incoming payload", {
    title: data.title,
    projectId: data.projectId,
    dependsOnTaskId: data.dependsOnTaskId,
  });

  const project = await prisma.project.findFirst({
    where: {
      id: data.projectId,
      orgId,
    },
  });

  if (!project) {
    throw new AppError(
      "Project not found or does not belong to active organization",
      403
    );
  }

  const created = await taskRepository.createTask({
    title: data.title,
    description: data.description,
    status: data.status || "TODO",
    priority: data.priority || "MEDIUM",
    estimateHours: data.estimateHours,
    startDate: data.startDate,
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
    organizationId: orgId,
    projectId: data.projectId,
    createdById: userId,
    assigneeId: data.assigneeId,
  });

  // If dependsOnTaskId provided, create dependency relationship
  if (data.dependsOnTaskId) {
    if (created.id === data.dependsOnTaskId) {
      throw new AppError("Task cannot depend on itself", 400);
    }

    // Verify the dependency task exists and belongs to same project
    const depTask = await taskRepository.getTaskById(data.dependsOnTaskId);
    if (!depTask || depTask.projectId !== data.projectId) {
      throw new AppError("Dependency task not found or belongs to different project", 404);
    }

    // Check for circular dependencies
    const isCircular = await taskRepository.isCircularDependency(data.dependsOnTaskId, created.id);
    if (isCircular) {
      throw new AppError("Circular dependency detected", 400);
    }

    // Create the dependency
    await taskRepository.createDependency(created.id, data.dependsOnTaskId);
  }

  // Ensure blocked state reflects any dependencies (if present)
  await recalcAndPersistBlockedState(created.id);

  // return enriched task
  const task = await taskRepository.getTaskById(created.id);
  const computed = computeCoordinationState(task);
  console.log("[taskService.createTask] persisted task", {
    id: task?.id,
    title: task?.title,
    status: task?.status,
    dependencies: task?.dependencies,
    dependencyIds: task?.dependencies?.map((dependency) => dependency.dependsOnTaskId) ?? [],
    dependencyCount: task?.dependencies?.length ?? 0,
    blockingTaskCount: computed.blockingTasks.length,
    isBlocked: computed.isBlocked,
    coordinationState: computed.coordinationState,
  });
  return {
    ...task,
    isBlocked: computed.isBlocked,
    blockingTasks: computed.blockingTasks,
    coordinationReason: computed.coordinationReason,
    coordinationState: computed.coordinationState,
  };
}

/**
 * GET TASKS BY PROJECT
 */
async function getTasksByProject(orgId, projectId, filters = {}) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      orgId,
    },
  });

  if (!project) {
    throw new AppError(
      "Project not found or does not belong to active organization",
      403
    );
  }

  const tasks = await taskRepository.getTasksByProject(projectId, filters);
  console.log("[taskService.getTasksByProject] fetched tasks", tasks.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    dependencyCount: task.dependencies?.length ?? 0,
  })));

  // enrich tasks with blocked state using available dependency data (batched)
  const enriched = tasks.map((t) => {
    const computed = computeCoordinationState(t);
    return {
      ...t,
      isBlocked: computed.isBlocked,
      blockingTasks: computed.blockingTasks,
      coordinationReason: computed.coordinationReason,
      coordinationState: computed.coordinationState,
    };
  });

  return enriched;
}

/**
 * GET TASK BY ID
 */
async function getTaskById(taskId) {
  if (!taskId) {
    throw new AppError("Task ID is required", 400);
  }

  const task = await taskRepository.getTaskById(taskId);

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  const computed = computeCoordinationState(task);
  return {
    ...task,
    isBlocked: computed.isBlocked,
    blockingTasks: computed.blockingTasks,
    coordinationReason: computed.coordinationReason,
    coordinationState: computed.coordinationState,
  };
}

/**
 * UPDATE TASK
 */
async function updateTask(taskId, data) {
  if (!taskId) {
    throw new AppError("Task ID is required", 400);
  }

  const existingTask = await taskRepository.getTaskById(taskId);

  if (!existingTask) {
    throw new AppError("Task not found", 404);
  }

  await taskRepository.updateTask(taskId, data);

  // If status changed, recalc dependents' blocked state
  if (data.status) {
    const dependents = await taskRepository.getDependentsByTaskId(taskId);
    for (const dep of dependents) {
      await recalcAndPersistBlockedState(dep.task.id);
    }
  }

  // ensure this task's own blocked state is consistent
  await recalcAndPersistBlockedState(taskId);

  const refreshed = await taskRepository.getTaskById(taskId);
  const computed = computeCoordinationState(refreshed);

  // Check for coordination suggestions (e.g., dependent tasks that are now READY)
  let coordinationSuggestions = [];
  if (data.status) {
    coordinationSuggestions = await coordinationService.findCoordinationSuggestions(taskId);
  }

  return {
    ...refreshed,
    isBlocked: computed.isBlocked,
    blockingTasks: computed.blockingTasks,
    coordinationReason: computed.coordinationReason,
    coordinationState: computed.coordinationState,
    coordinationSuggestions,
  };
}

/**
 * DELETE TASK
 */
async function deleteTask(taskId) {
  if (!taskId) {
    throw new AppError("Task ID is required", 400);
  }

  const existingTask = await taskRepository.getTaskById(taskId);

  if (!existingTask) {
    throw new AppError("Task not found", 404);
  }

  const dependentTaskIds = (existingTask.dependents || []).map((dependency) => dependency.task?.id).filter(Boolean);

  const deletedTask = await taskRepository.deleteTask(taskId);

  for (const dependentTaskId of dependentTaskIds) {
    await recalcAndPersistBlockedState(dependentTaskId);
  }

  return deletedTask;
}

/**
 * ADD DEPENDENCY
 */
async function addDependency(taskId, dependsOnTaskId) {
  if (!taskId) {
    throw new AppError("Task ID is required", 400);
  }

  if (taskId === dependsOnTaskId) {
    throw new AppError("Task cannot depend on itself", 400);
  }

  const task = await taskRepository.getTaskById(taskId);
  const dependsOnTask = await taskRepository.getTaskById(dependsOnTaskId);

  if (!task || !dependsOnTask) {
    throw new AppError("One or both tasks not found", 404);
  }

  const existing = await taskRepository.getDependency(taskId, dependsOnTaskId);
  if (existing) {
    throw new AppError("Dependency already exists", 409);
  }

  const isCircular = await taskRepository.isCircularDependency(dependsOnTaskId, taskId);
  if (isCircular) {
    throw new AppError("Circular dependency detected", 400);
  }

  const created = await taskRepository.createDependency(taskId, dependsOnTaskId);

  // After adding dependency, task becomes blocked if dependency incomplete
  await recalcAndPersistBlockedState(taskId);

  return created;
}

/**
 * REMOVE DEPENDENCY
 */
async function removeDependency(dependencyId) {
  if (!dependencyId) {
    throw new AppError("Dependency ID is required", 400);
  }

  const dependency = await taskRepository.getDependencyById(dependencyId);

  if (!dependency) {
    throw new AppError("Dependency not found", 404);
  }

  await taskRepository.removeDependency(dependencyId);

  // Recalc blocked state for the owning task
  await recalcAndPersistBlockedState(dependency.taskId);

  return { message: "Dependency deleted successfully" };
}

/**
 * GET DEPENDENCY GRAPH
 */
async function getDependencyGraph(taskId) {
  if (!taskId) {
    throw new AppError("Task ID is required", 400);
  }

  const dependencies = await taskRepository.getDependenciesByTaskId(taskId);
  return { dependencies };
}

/**
 * GET AVAILABLE TASKS FOR DEPENDENCY SELECTION
 * Returns all tasks in a project that can be selected as dependencies
 * Filters out completed/cancelled tasks and the current task
 */
async function getAvailableTasksForDependency(orgId, projectId, excludeTaskId) {
  if (!projectId) {
    throw new AppError("Project ID is required", 400);
  }

  // Get all tasks in the project, optionally excluding current task
  const filters = {};
  if (excludeTaskId) {
    filters.NOT = { id: excludeTaskId };
  }

  // Filter out DONE and CANCELLED tasks - only show tasks that can block
  const allTasks = await taskRepository.getTasksByProject(projectId, {
    ...filters,
    status: {
      in: ["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED"]
    }
  });
  
  const available = allTasks.map(task => ({
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
  }));

  return available;
}

module.exports = {
  createTask,
  getTasksByProject,
  getTaskById,
  updateTask,
  deleteTask,
  addDependency,
  removeDependency,
  getDependencyGraph,
  getAvailableTasksForDependency,
};
