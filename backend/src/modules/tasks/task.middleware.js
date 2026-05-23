const { AppError } = require('../../utils/AppError');
const taskRepository = require('./task.repository');

const loadTask = async (req, res, next) => {
  try {
    const taskId = req.params.taskId || req.params.id;
    if (!taskId) {
      return next(new AppError('Task ID is required', 400));
    }

    const task = await taskRepository.getTaskById(taskId);
    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    // Ensure the task belongs to the organization in context
    const orgId = req.orgId || req.query.orgId || req.body.orgId || (req.auth && req.auth.activeOrgId);
    if (orgId && task.organizationId !== orgId) {
      return next(new AppError('Task does not belong to this organization', 403));
    }

    req.task = task;
    // Set orgId for downstream requireOrgMembership middleware
    req.orgId = task.organizationId;
    
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loadTask
};
