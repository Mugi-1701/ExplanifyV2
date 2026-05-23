const { prisma } = require("../../lib/prisma");

async function createTask(data) {
  return prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,

      estimateHours: data.estimateHours,
      startDate: data.startDate,
      dueDate: data.dueDate,

      project: {
        connect: {
          id: data.projectId
        }
      },

      organization: {
        connect: {
          id: data.orgId
        }
      },

      creator: {
        connect: {
          id: data.createdById
        }
      },

      ...(data.assigneeId && {
        assignee: {
          connect: {
            id: data.assigneeId
          }
        }
      })
    },

    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },

      creator: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
}

async function getTasksByProject(projectId, filters = {}) {
  return prisma.task.findMany({
    where: {
      projectId,
      ...filters
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
}

async function getTaskById(id) {
  return prisma.task.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
      dependencies: {
        include: {
          dependsOnTask: { select: { id: true, title: true, status: true } }
        }
      },
      dependents: {
        include: {
          task: { select: { id: true, title: true, status: true } }
        }
      }
    }
  });
}

async function updateTask(id, data) {
  return prisma.task.update({
    where: { id },
    data,
    include: {
      assignee: { select: { id: true, name: true, email: true } },
    }
  });
}

async function deleteTask(id) {
  return prisma.task.delete({
    where: { id }
  });
}

async function createDependency(taskId, dependsOnTaskId) {
  return prisma.taskDependency.create({
    data: {
      taskId,
      dependsOnTaskId
    }
  });
}

async function removeDependency(id) {
  return prisma.taskDependency.delete({
    where: { id }
  });
}

async function getDependency(taskId, dependsOnTaskId) {
  return prisma.taskDependency.findUnique({
    where: {
      taskId_dependsOnTaskId: {
        taskId,
        dependsOnTaskId
      }
    }
  });
}

async function getDependencyById(id) {
  return prisma.taskDependency.findUnique({
    where: { id }
  });
}

async function getDependenciesByTaskId(taskId) {
  return prisma.taskDependency.findMany({
    where: { taskId },
    include: {
      dependsOnTask: { select: { id: true, title: true, status: true } }
    }
  });
}

async function getDependentsByTaskId(dependsOnTaskId) {
  return prisma.taskDependency.findMany({
    where: { dependsOnTaskId },
    include: {
      task: { select: { id: true, title: true, status: true } }
    }
  });
}

async function isCircularDependency(currentTaskId, targetTaskId, visited = new Set()) {
  if (currentTaskId === targetTaskId) return true;
  if (visited.has(currentTaskId)) return false;

  visited.add(currentTaskId);

  const dependencies = await prisma.taskDependency.findMany({
    where: { taskId: currentTaskId },
    select: { dependsOnTaskId: true }
  });

  for (const dep of dependencies) {
    const isCircular = await isCircularDependency(
      dep.dependsOnTaskId,
      targetTaskId,
      visited
    );

    if (isCircular) return true;
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
  isCircularDependency
};