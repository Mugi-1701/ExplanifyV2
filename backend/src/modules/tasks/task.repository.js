const { prisma } = require("../../lib/prisma");

/**
 * CREATE TASK
 */
async function createTask(data) {
  return prisma.task.create({
    data: {
      title: data.title,

      description: data.description,

      status: data.status || "TODO",

      priority: data.priority || "MEDIUM",

      estimateHours:
        data.estimateHours || null,

      startDate:
        data.startDate || null,

      dueDate:
        data.dueDate || null,

      organizationId:
        data.organizationId,

      projectId:
        data.projectId,

      createdById:
        data.createdById,

      ...(data.assigneeId && {
        assigneeId: data.assigneeId,
      }),
    },

    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },

      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * GET TASKS BY PROJECT
 */
async function getTasksByProject(
  projectId,
  filters = {}
) {
  return prisma.task.findMany({
    where: {
      projectId,
      ...filters,
    },

    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      // include dependency relations so callers can compute blocking state
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

    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * GET TASK BY ID
 */
async function getTaskById(taskId) {
  return prisma.task.findUnique({
    where: {
      id: taskId,
    },

    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },

      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },

      dependencies: {
        include: {
          dependsOnTask: true,
        },
      },

      dependents: {
        include: {
          task: true,
        },
      },
    },
  });
}

/**
 * UPDATE TASK
 */
async function updateTask(taskId, data) {
  return prisma.task.update({
    where: {
      id: taskId,
    },

    data,

    include: {
      assignee: true,
    },
  });
}

/**
 * DELETE TASK
 */
async function deleteTask(taskId) {
  return prisma.task.delete({
    where: {
      id: taskId,
    },
  });
}

/**
 * CREATE DEPENDENCY
 */
async function createDependency(
  taskId,
  dependsOnTaskId
) {
  return prisma.taskDependency.create({
    data: {
      taskId,
      dependsOnTaskId,
    },
  });
}

/**
 * REMOVE DEPENDENCY
 */
async function removeDependency(id) {
  return prisma.taskDependency.delete({
    where: { id },
  });
}

/**
 * GET DEPENDENCY
 */
async function getDependency(
  taskId,
  dependsOnTaskId
) {
  return prisma.taskDependency.findUnique({
    where: {
      taskId_dependsOnTaskId: {
        taskId,
        dependsOnTaskId,
      },
    },
  });
}

/**
 * GET DEPENDENCY BY ID
 */
async function getDependencyById(id) {
  return prisma.taskDependency.findUnique({
    where: { id },
  });
}

/**
 * GET DEPENDENCIES BY TASK ID
 */
async function getDependenciesByTaskId(
  taskId
) {
  return prisma.taskDependency.findMany({
    where: {
      taskId,
    },

    include: {
      dependsOnTask: true,
    },
  });
}

/**
 * GET DEPENDENTS BY TASK ID
 */
async function getDependentsByTaskId(
  dependsOnTaskId
) {
  return prisma.taskDependency.findMany({
    where: {
      dependsOnTaskId,
    },

    include: {
      task: true,
    },
  });
}

/**
 * CIRCULAR DEPENDENCY CHECK
 */
async function isCircularDependency(
  currentTaskId,
  targetTaskId,
  visited = new Set()
) {
  if (currentTaskId === targetTaskId) {
    return true;
  }

  if (visited.has(currentTaskId)) {
    return false;
  }

  visited.add(currentTaskId);

  const dependencies =
    await prisma.taskDependency.findMany({
      where: {
        taskId: currentTaskId,
      },

      select: {
        dependsOnTaskId: true,
      },
    });

  for (const dep of dependencies) {
    const circular =
      await isCircularDependency(
        dep.dependsOnTaskId,
        targetTaskId,
        visited
      );

    if (circular) {
      return true;
    }
  }

  return false;
}

module.exports = {
  createTask,
  getTasksByProject,
  getTaskById,
  updateTask,
  deleteTask,
  createDependency,
  removeDependency,
  getDependency,
  getDependencyById,
  getDependenciesByTaskId,
  getDependentsByTaskId,
  isCircularDependency,
};