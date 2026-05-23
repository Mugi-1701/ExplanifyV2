const express = require('express');
const router = express.Router();
const taskController = require('./task.controller');
const taskMiddleware = require('./task.middleware');
const { authenticate } = require('../auth/auth.middleware');
const { requireOrgMembership, requireOrgRole } = require('../organizations/organization.middleware');
const { validate } = require('../../middleware/validate');
const { createTaskSchema, updateTaskSchema, createDependencySchema } = require('./task.validation');

// Simple middleware to extract orgId and ensure active context
const extractTasksContext = (req, res, next) => {
  // Respect payload if explicit, but default to the session's active org context safely
  if (req.body.organizationId) req.orgId = req.body.organizationId;
  else if (req.query.organizationId) req.orgId = req.query.organizationId;
  else if (req.body.orgId) req.orgId = req.body.orgId;
  else if (req.query.orgId) req.orgId = req.query.orgId;
  else if (req.auth && req.auth.activeOrgId) req.orgId = req.auth.activeOrgId;

  next();
};

router.use(authenticate());

// POST /api/tasks
router.post(
  '/',
  validate(createTaskSchema),
  extractTasksContext,
  requireOrgMembership(),
  taskController.createTask
);

// GET /api/tasks?projectId=xxx&orgId=yyy
router.get(
  '/',
  extractTasksContext,
  requireOrgMembership(),
  taskController.getTasks
);

// Middleware for ID routes
router.use('/:id', taskMiddleware.loadTask, requireOrgMembership());

// GET /api/tasks/:id
router.get('/:id', taskController.getTaskById);

// PATCH /api/tasks/:id
router.patch(
  '/:id',
  validate(updateTaskSchema),
  taskController.updateTask
);

// DELETE /api/tasks/:id
router.delete('/:id', taskController.deleteTask);

// Dependency endpoints
// POST /api/tasks/:id/dependencies
router.post(
  '/:id/dependencies',
  validate(createDependencySchema),
  taskController.addDependency
);

// GET /api/tasks/:id/dependencies
router.get('/:id/dependencies', taskController.getDependencies);

// DELETE /api/tasks/:id/dependencies/:dependencyId
router.delete('/:id/dependencies/:dependencyId', taskController.removeDependency);

module.exports = router;
