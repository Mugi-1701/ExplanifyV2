const { AppError } = require('../../utils/AppError');
const taskRepository = require('./task.repository');

async function createTask(orgId, userId, data) {
  // Validate project belongs to the targeted organization
  const { prisma } = require("../../lib/prisma");
  const project = await prisma.project.findUnique({
    where: { id: data.projectId },
    select: { orgId: true }
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (project.orgId !== orgId) {
    throw new AppError('Project does not belong to the active organization', 403);
  }

  return taskRepository.createTask({
    title: data.title,
    description: data.description,
    status: data.status || 'TODO',
    priority: data.priority || 'MEDIUM',
    estimateHours: data.estimateHours,
    startDate: data.startDate,
    dueDate: data.dueDate,
    orgId,
    projectId: data.projectId,
    createdById: userId,
    ...(data.assigneeId && { assigneeId: data.assigneeId })
  });
}

async function getTasksByProject(orgId, projectId, filters = {}) {
  // Validate project belongs to the targeted organization
  const { prisma } = require("../../lib/prisma");
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { orgId: true }
  });

  if (!project || project.orgId !== orgId) {
    throw new AppError('Project not found or does not belong to active organization', 403);
  }

  return taskRepository.getTasksByProject(projectId, filters);
}

async function getTaskById(id) {
  const task = await taskRepository.getTaskById(id);
  if (!task) {
    throw new AppError('Task not found', 404);
  }
  return task;
}

async function updateTask(id, data) {
  const currentTask = await taskRepository.getTaskById(id);
  if (!currentTask) {
    throw new AppError('Task not found', 404);
  }

  // Update logic
  return taskRepository.updateTask(id, data);
}

async function deleteTask(id) {
  return taskRepository.deleteTask(id);
}

async function addDependency(taskId, dependsOnTaskId) {
  // Rule 2: Prevent self dependency
  if (taskId === dependsOnTaskId) {
    throw new AppError('Task cannot depend on itself', 400);
  }

  const task1 = await taskRepository.getTaskById(taskId);
  const task2 = await taskRepository.getTaskById(dependsOnTaskId);

  if (!task1 || !task2) {
    throw new AppError('One or both tasks not found', 404);
  }
  
  // Both tasks must belong to the same organization
  if (task1.organizationId !== task2.organizationId) {
     throw new AppError('Tasks must belong to the same organization', 400);
  }

  // Prevent duplicate dependency
  const existing = await taskRepository.getDependency(taskId, dependsOnTaskId);
  if (existing) {
    throw new AppError('Dependency already exists', 409);
  }

  // Rule 1: Prevent circular dependency
  // If we add A -> B, we must check if B (the one we depend on) already depends on A
  // Meaning: dependsOnTaskId depends on taskId?
  const isCircular = await taskRepository.isCircularDependency(dependsOnTaskId, taskId);
  if (isCircular) {
    throw new AppError('Circular dependency detected', 400);
  }

  const dependency = await taskRepository.createDependency(taskId, dependsOnTaskId);

  // Rule 3: If dependency incomplete, task status may become BLOCKED
  if (task2.status !== 'DONE' && task2.status !== 'CANCELED') {
      if (task1.status === 'TODO' || task1.status === 'IN_PROGRESS') {
          await taskRepository.updateTask(taskId, { status: 'BLOCKED' });
      }
  }

  return dependency;
}

async function removeDependency(taskId, dependencyId) {
  const dependency = await taskRepository.getDependencyById(dependencyId);
  if (!dependency) {
    throw new AppError('Dependency not found', 404);
  }
  if (dependency.taskId !== taskId) {
    throw new AppError('Dependency does not belong to this task', 403);
  }

  await taskRepository.removeDependency(dependencyId);
  
  // Optional: re-evaluate if task should still be blocked (if it has other incomplete dependencies)
  const remainingDeps = await taskRepository.getDependenciesByTaskId(taskId);
  const hasIncompleteDeps = remainingDeps.some(dep => dep.dependsOnTask.status !== 'DONE' && dep.dependsOnTask.status !== 'CANCELED');
  if (!hasIncompleteDeps) {
      // Revert from BLOCKED conceptually (or client can do it manually)
      const task = await taskRepository.getTaskById(taskId);
      if (task.status === 'BLOCKED') {
          await taskRepository.updateTask(taskId, { status: 'TODO' });
      }
  }

  return true;
}

async function getDependencyGraph(taskId) {
    const dependencies = await taskRepository.getDependenciesByTaskId(taskId);
    const blockers = dependencies.filter(d => d.dependsOnTask.status !== 'DONE' && d.dependsOnTask.status !== 'CANCELED');
    
    return {
       dependencies,
       blockers
    };
}

module.exports = {
  createTask,
  getTasksByProject,
  getTaskById,
  updateTask,
  deleteTask,
  addDependency,
  removeDependency,
  getDependencyGraph
};
