const { AppError } = require("../../utils/AppError");
const taskRepository = require("./task.repository");
const { prisma } = require("../../lib/prisma");
const { computeCoordinationState, getTaskBlockingState } = require("./utils/getTaskBlockingState");
const coordinationService = require("./coordination.service");
const { recordEventSafely } = require("../events/service");

function attachCalendarEvent(task) {
  if (!task) {
    return task;
  }

  const calendarEvent = Array.isArray(task.calendarEvents) ? task.calendarEvents[0] ?? null : task.calendarEvents ?? null;
  return {
    ...task,
    calendarEvent,
  };
}

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

  // TEMP DEBUG: selected skills before persistence.
  // eslint-disable-next-line no-console
  console.log("[tasks.create] selected skills before submit", data.requiredSkills ?? []);
  // eslint-disable-next-line no-console
  console.log("[tasks.create] receivedRequiredSkills", data.requiredSkills ?? []);
  // eslint-disable-next-line no-console
  console.log("[tasks.create] backend received payload", {
    projectId: data.projectId,
    title: data.title,
    requiredSkills: data.requiredSkills ?? [],
  });

  const created = await taskRepository.createTask({
    title: data.title,
    description: data.description,
    requiredSkills: data.requiredSkills ?? [],
    status: data.status || "TODO",
    priority: data.priority || "MEDIUM",
    estimateHours: data.estimateHours,
    startDate: data.startDate,
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
    organizationId: orgId,
    projectId: data.projectId,
    createdById: userId,
    assigneeId: data.assigneeId,
    aiRecommendedUserId: data.aiRecommendedUserId,
    aiRecommendationScore: data.aiRecommendationScore,
    aiRecommendationConfidence: data.aiRecommendationConfidence,
    aiRecommendationExplanation: data.aiRecommendationExplanation,
  });

  recordEventSafely({
    organizationId: orgId,
    userId,
    eventType: "TASK_CREATED",
    entityType: "Task",
    entityId: created.id,
    projectId: created.projectId,
    metadata: {
      taskTitle: created.title,
      priority: created.priority,
      assigneeName: created.assignee?.name ?? null,
      assigneeId: created.assigneeId ?? null,
    },
  });

  if (created.assigneeId) {
    recordEventSafely({
      organizationId: orgId,
      userId,
      eventType: "TASK_ASSIGNED",
      entityType: "Task",
      entityId: created.id,
      projectId: created.projectId,
      metadata: {
        oldAssigneeName: null,
        newAssigneeName: created.assignee?.name ?? null,
      },
    });
  }

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
    const dependency = await taskRepository.createDependency(created.id, data.dependsOnTaskId);

    recordEventSafely({
      organizationId: orgId,
      userId,
      eventType: "DEPENDENCY_CREATED",
      entityType: "TaskDependency",
      entityId: dependency.id,
      projectId: created.projectId,
      metadata: {
        taskId: created.id,
        dependsOnTaskId: data.dependsOnTaskId,
      },
    });
  }

  // Ensure blocked state reflects any dependencies (if present)
  await recalcAndPersistBlockedState(created.id);

  // return enriched task
  const task = await taskRepository.getTaskById(created.id);
  const computed = computeCoordinationState(task);
  const result = attachCalendarEvent({
    ...task,
    isBlocked: computed.isBlocked,
    blockingTasks: computed.blockingTasks,
    coordinationReason: computed.coordinationReason,
    coordinationState: computed.coordinationState,
  });

  // TEMP DEBUG: verify DB saved value and API response value.
  // eslint-disable-next-line no-console
  console.log("[tasks.create] savedRequiredSkills", task?.requiredSkills ?? []);
  // eslint-disable-next-line no-console
  console.log("[tasks.create] returnedRequiredSkills", result?.requiredSkills ?? []);

  return result;
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

  // TEMP DEBUG: verify GET task list response carries requiredSkills.
  // eslint-disable-next-line no-console
  console.log("[tasks.getByProject] returnedRequiredSkills", enriched.map((task) => ({
    taskId: task.id,
    requiredSkills: task.requiredSkills ?? [],
  })));

  return enriched.map(attachCalendarEvent);
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
  const result = attachCalendarEvent({
    ...task,
    isBlocked: computed.isBlocked,
    blockingTasks: computed.blockingTasks,
    coordinationReason: computed.coordinationReason,
    coordinationState: computed.coordinationState,
  });

  // TEMP DEBUG: verify GET single task response carries requiredSkills.
  // eslint-disable-next-line no-console
  console.log("[tasks.getById] returnedRequiredSkills", {
    taskId: result.id,
    requiredSkills: result.requiredSkills ?? [],
  });

  return result;
}

/**
 * UPDATE TASK
 */
async function updateTask(taskId, data, userId) {
  if (!taskId) {
    throw new AppError("Task ID is required", 400);
  }

  const existingTask = await taskRepository.getTaskById(taskId);

  if (!existingTask) {
    throw new AppError("Task not found", 404);
  }

  // TEMP DEBUG: selected skills before persistence.
  // eslint-disable-next-line no-console
  console.log("[tasks.update] selected skills before submit", data.requiredSkills ?? []);
  // eslint-disable-next-line no-console
  console.log("[tasks.update] receivedRequiredSkills", data.requiredSkills ?? []);
  // eslint-disable-next-line no-console
  console.log("[tasks.update] backend received payload", {
    taskId,
    requiredSkills: data.requiredSkills ?? [],
  });

  const updatedTask = await taskRepository.updateTask(taskId, data);

  const actorId = userId ?? existingTask.createdById;
  const eventsToPublish = [];
  const hasStatusChange =
    data.status !== undefined && data.status !== existingTask.status;
  const hasAssigneeChange =
    data.assigneeId !== undefined && data.assigneeId !== existingTask.assigneeId;

  if (hasStatusChange) {
    eventsToPublish.push({
      organizationId: existingTask.organizationId,
      userId: actorId,
      projectId: existingTask.projectId,
      eventType: "TASK_UPDATED",
      entityType: "Task",
      entityId: taskId,
      metadata: {
        taskTitle: existingTask.title,
        status: {
          from: existingTask.status,
          to: data.status,
        },
      },
    });
  }

  if (hasAssigneeChange) {
    eventsToPublish.push({
      organizationId: existingTask.organizationId,
      userId: actorId,
      projectId: existingTask.projectId,
      eventType: "TASK_ASSIGNED",
      entityType: "Task",
      entityId: taskId,
      metadata: {
        taskTitle: existingTask.title,
        previousAssigneeName: existingTask.assignee?.name ?? null,
        newAssigneeName: updatedTask.assignee?.name ?? null,
      },
    });
  }

  if (!hasStatusChange && !hasAssigneeChange) {
    eventsToPublish.push({
      organizationId: existingTask.organizationId,
      userId: actorId,
      projectId: existingTask.projectId,
      eventType: "TASK_UPDATED",
      entityType: "Task",
      entityId: taskId,
      metadata: {
        taskTitle: existingTask.title,
        changes: {
          ...data,
          ...(data.status !== undefined
            ? {
                status: {
                  from: existingTask.status,
                  to: data.status,
                },
              }
            : {}),
          ...(data.priority !== undefined
            ? {
                priority: {
                  from: existingTask.priority,
                  to: data.priority,
                },
              }
            : {}),
          ...(data.dueDate !== undefined
            ? {
                dueDate: {
                  from: existingTask.dueDate,
                  to: data.dueDate,
                },
              }
            : {}),
        },
      },
    });
  }

  if (data.status === "DONE" && existingTask.status !== "DONE") {
    eventsToPublish.push({
      organizationId: existingTask.organizationId,
      userId: actorId,
      projectId: existingTask.projectId,
      eventType: "TASK_COMPLETED",
      entityType: "Task",
      entityId: taskId,
    metadata: {
      oldStatus: existingTask.status,
      newStatus: data.status,
      taskTitle: existingTask.title,
    },
  });
  }

  for (const event of eventsToPublish) {
    recordEventSafely(event);
  }

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

  const result = attachCalendarEvent({
    ...refreshed,
    isBlocked: computed.isBlocked,
    blockingTasks: computed.blockingTasks,
    coordinationReason: computed.coordinationReason,
    coordinationState: computed.coordinationState,
    coordinationSuggestions,
  });

  // TEMP DEBUG: verify DB saved value and API response value.
  // eslint-disable-next-line no-console
  console.log("[tasks.update] savedRequiredSkills", refreshed?.requiredSkills ?? []);
  // eslint-disable-next-line no-console
  console.log("[tasks.update] returnedRequiredSkills", result?.requiredSkills ?? []);

  return result;
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

  recordEventSafely({
    organizationId: existingTask.organizationId,
    userId: existingTask.createdById,
    projectId: existingTask.projectId,
    eventType: "TASK_DELETED",
    entityType: "Task",
    entityId: taskId,
    metadata: {
      taskTitle: existingTask.title,
      projectName: existingTask.project?.name ?? null,
    },
  });

  const deletedTask = await taskRepository.deleteTask(taskId);

  for (const dependentTaskId of dependentTaskIds) {
    await recalcAndPersistBlockedState(dependentTaskId);
  }

  return deletedTask;
}

async function scheduleTask(taskId, userId, data) {
  if (!taskId) {
    throw new AppError("Task ID is required", 400);
  }

  const task = await taskRepository.getTaskById(taskId);
  if (!task) {
    throw new AppError("Task not found", 404);
  }

  if (task.createdById !== userId && task.assigneeId !== userId) {
    throw new AppError("You can only schedule tasks you own or are assigned to", 403);
  }

  const project = await prisma.project.findFirst({
    where: {
      id: task.projectId,
      orgId: task.organizationId,
    },
    select: {
      id: true,
      ownerId: true,
      members: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!project) {
    throw new AppError("You do not have access to this task's project", 403);
  }

  const isProjectOwner = project.ownerId === userId;
  const isProjectMember = project.members.some((member) => member.userId === userId);
  if (!isProjectOwner && !isProjectMember && task.createdById !== userId && task.assigneeId !== userId) {
    throw new AppError("You can only schedule tasks you own or are assigned to", 403);
  }

  const startTime = new Date(data.date);
  const [hours, minutes] = data.startTime.split(":").map((value) => Number(value));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    throw new AppError("startTime must be HH:mm", 400);
  }
  startTime.setHours(hours, minutes, 0, 0);
  const endTime = new Date(startTime.getTime() + data.durationMinutes * 60_000);

  const createdEvent = await taskRepository.createCalendarEvent({
    title: data.title?.trim() || task.title,
    description: data.description ?? task.description ?? null,
    startTime,
    endTime,
    taskId: task.id,
    userId,
  });

  const refreshedTask = await taskRepository.getTaskById(task.id);

  return {
    task: {
      ...refreshedTask,
      calendarEvent: createdEvent,
    },
    calendarEvent: createdEvent,
  };
}

/**
 * ADD DEPENDENCY
 */
async function addDependency(taskId, dependsOnTaskId, userId) {
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

  recordEventSafely({
    organizationId: task.organizationId,
    userId: userId ?? task.createdById,
    projectId: task.projectId,
    eventType: "DEPENDENCY_CREATED",
    entityType: "TaskDependency",
    entityId: created.id,
    metadata: {
      taskId,
      dependsOnTaskId,
    },
  });

  // After adding dependency, task becomes blocked if dependency incomplete
  await recalcAndPersistBlockedState(taskId);

  return created;
}

/**
 * REMOVE DEPENDENCY
 */
async function removeDependency(dependencyId, userId) {
  if (!dependencyId) {
    throw new AppError("Dependency ID is required", 400);
  }

  const dependency = await taskRepository.getDependencyById(dependencyId);

  if (!dependency) {
    throw new AppError("Dependency not found", 404);
  }

  await taskRepository.removeDependency(dependencyId);

  recordEventSafely({
    organizationId: dependency.task?.organizationId,
    userId: userId ?? dependency.task?.createdById,
    projectId: dependency.task?.projectId,
    eventType: "DEPENDENCY_REMOVED",
    entityType: "TaskDependency",
    entityId: dependencyId,
    metadata: {
      taskId: dependency.taskId,
      dependsOnTaskId: dependency.dependsOnTaskId,
    },
  });

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
  scheduleTask,
  addDependency,
  removeDependency,
  getDependencyGraph,
  getAvailableTasksForDependency,
};
