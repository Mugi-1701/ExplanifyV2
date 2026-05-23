const taskService = require('./task.service');
const { createTaskSchema, updateTaskSchema, createDependencySchema } = require('./task.validation');

async function createTask(req, res, next) {
  try {
    const orgId = req.orgId || req.body.orgId;
    const userId = req.auth ? req.auth.userId : req.user.id;
    const validatedData = createTaskSchema.parse(req.body);

    const task = await taskService.createTask(orgId, userId, validatedData);
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
}

async function getTasks(req, res, next) {
  try {
    const { projectId } = req.query;
    const orgId = req.orgId || req.query.orgId;
    
    // We expect projectId to be provided to scope it, you can optionally support fetching all tasks within an org too
    let filters = {};
    if (req.query.status) filters.status = req.query.status;
    
    if (!projectId) {
       return res.status(400).json({ status: 'error', message: 'projectId is required in query' });
    }

    const tasks = await taskService.getTasksByProject(orgId, projectId, filters);
    res.json(tasks);
  } catch (error) {
    next(error);
  }
}

async function getTaskById(req, res, next) {
  try {
    // req.task is loaded by middleware
    res.json(req.task);
  } catch (error) {
    next(error);
  }
}

async function updateTask(req, res, next) {
  try {
    const validatedData = updateTaskSchema.parse(req.body);
    const updated = await taskService.updateTask(req.task.id, validatedData);
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

async function deleteTask(req, res, next) {
  try {
    await taskService.deleteTask(req.task.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function addDependency(req, res, next) {
  try {
    const validatedData = createDependencySchema.parse(req.body);
    const dependency = await taskService.addDependency(req.task.id, validatedData.dependsOnTaskId);
    res.status(201).json(dependency);
  } catch (error) {
    next(error);
  }
}

async function getDependencies(req, res, next) {
  try {
    const graph = await taskService.getDependencyGraph(req.task.id);
    res.json(graph);
  } catch (error) {
    next(error);
  }
}

async function removeDependency(req, res, next) {
  try {
    await taskService.removeDependency(req.task.id, req.params.dependencyId);
    res.status(204).send();
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
  removeDependency
};
