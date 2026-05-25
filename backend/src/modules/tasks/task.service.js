const { AppError } = require("../../utils/AppError");
const taskRepository = require("./task.repository");
const { prisma } = require("../../lib/prisma");
const { computeCoordinationState, getTaskBlockingState } = require("./utils/getTaskBlockingState");

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
    dueDate: data.dueDate,
    organizationId: orgId,
    projectId: data.projectId,
    createdById: userId,
    assigneeId: data.assigneeId,
  });

  // Ensure blocked state reflects any dependencies (if present)
  await recalcAndPersistBlockedState(created.id);

  // return enriched task
  const task = await taskRepository.getTaskById(created.id);
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

  const updated = await taskRepository.updateTask(taskId, data);

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

  return {
    ...updated,
    isBlocked: computed.isBlocked,
    blockingTasks: computed.blockingTasks,
    coordinationReason: computed.coordinationReason,
    coordinationState: computed.coordinationState,
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

  return taskRepository.deleteTask(taskId);
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

module.exports = {
  createTask,
  getTasksByProject,
  getTaskById,
  updateTask,
  deleteTask,
  addDependency,
  removeDependency,
  getDependencyGraph,
};