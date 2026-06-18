const taskService = require("./task.service");

const resolveActiveOrgId = (req) =>
  req.orgId || req.auth?.activeOrgId || req.auth?.organizationId || req.auth?.orgId || null;

async function createTask(req, res, next) {
  try {
    const orgId = resolveActiveOrgId(req);

    if (!orgId) {
      return res.status(401).json({
        status: "error",
        message: "No active organization found in token",
      });
    }

    const userId = req.auth?.userId;

    const task = await taskService.createTask(orgId, userId, req.body);

    return res.status(201).json(task);
  } catch (error) {
    next(error);
  }
}

async function getTasks(req, res, next) {
  try {
    const orgId = resolveActiveOrgId(req);

    if (!orgId) {
      return res.status(401).json({
        status: "error",
        message: "No active organization found in token",
      });
    }

    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({
        status: "error",
        message: "projectId is required in query",
      });
    }

    const tasks = await taskService.getTasksByProject(orgId, projectId);

    return res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
}

async function getTaskById(req, res, next) {
  try {
    const taskId = req.params.taskId;
    const task = await taskService.getTaskById(taskId);
    return res.status(200).json(task);
  } catch (error) {
    next(error);
  }
}

async function updateTask(req, res, next) {
  try {
    const updatedTask = await taskService.updateTask(req.params.taskId, req.body);

    return res.status(200).json(updatedTask);
  } catch (error) {
    next(error);
  }
}

async function deleteTask(req, res, next) {
  try {
    await taskService.deleteTask(req.params.taskId);

    return res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

async function addDependency(req, res, next) {
  try {
    const taskId = req.body.taskId;
    const dependsOnTaskId = req.body.dependsOnTaskId;
    
    if (!taskId) {
      return res.status(400).json({
        status: "error",
        message: "taskId is required in body",
      });
    }

    const dependency = await taskService.addDependency(taskId, dependsOnTaskId);
    return res.status(201).json(dependency);
  } catch (error) {
    next(error);
  }
}

async function getDependencies(req, res, next) {
  try {
    const taskId = req.params.taskId;
    const graph = await taskService.getDependencyGraph(taskId);
    return res.status(200).json(graph);
  } catch (error) {
    next(error);
  }
}

async function removeDependency(req, res, next) {
  try {
    const dependencyId = req.params.dependencyId;
    await taskService.removeDependency(dependencyId);
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function getAvailableTasksForDependency(req, res, next) {
  try {
    const orgId = resolveActiveOrgId(req);
    const { projectId, excludeTaskId } = req.query;

    if (!projectId) {
      return res.status(400).json({
        status: "error",
        message: "projectId is required",
      });
    }

    const tasks = await taskService.getAvailableTasksForDependency(
      orgId,
      projectId,
      excludeTaskId
    );

    return res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  addDependency,
  getDependencies,
  removeDependency,
  getAvailableTasksForDependency,
};
