const express = require("express");

const router = express.Router();

const taskController = require("./task.controller");
const taskMiddleware = require("./task.middleware");

const { authenticate } = require("../auth/auth.middleware");

const {
  requireOrgMembership,
} = require("../organizations/organization.middleware");

const { validate } = require("../../middleware/validate");

const {
  createTaskSchema,
  updateTaskSchema,
  createDependencySchema,
} = require("./task.validation");

/**
 * Extract org/project context safely
 */
const extractTasksContext = (req, res, next) => {
  try {
    req.orgId =
      req.body?.organizationId ||
      req.query?.organizationId ||
      req.body?.orgId ||
      req.query?.orgId ||
      req.auth?.activeOrgId ||
      req.user?.organizationId ||
      null;

    req.projectId =
      req.body?.projectId ||
      req.query?.projectId ||
      req.params?.projectId ||
      null;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * ALL TASK ROUTES REQUIRE AUTH
 */
router.use(authenticate());

/**
 * =========================================
 * BASIC TASK ROUTES
 * =========================================
 */

/**
 * CREATE TASK
 * POST /api/tasks
 */
router.post(
  "/",
  validate(createTaskSchema),
  extractTasksContext,
  requireOrgMembership(),
  taskController.createTask
);

/**
 * GET TASKS
 * GET /api/tasks
 */
router.get(
  "/",
  extractTasksContext,
  requireOrgMembership(),
  taskController.getTasks
);

/**
 * =========================================
 * DEPENDENCY ROUTES
 * MUST COME BEFORE /:taskId
 * =========================================
 */

/**
 * CREATE DEPENDENCY
 * POST /api/tasks/dependencies
 */
router.post(
  "/dependencies",
  validate(createDependencySchema),
  extractTasksContext,
  requireOrgMembership(),
  taskController.addDependency
);

/**
 * GET TASK DEPENDENCIES
 * GET /api/tasks/:taskId/dependencies
 */
router.get(
  "/:taskId/dependencies",
  taskMiddleware.loadTask,
  taskController.getDependencies
);

/**
 * DELETE DEPENDENCY
 * DELETE /api/tasks/:taskId/dependencies/:dependencyId
 */
router.delete(
  "/:taskId/dependencies/:dependencyId",
  taskController.removeDependency
);

/**
 * GET AVAILABLE TASKS FOR DEPENDENCY SELECTION
 * GET /api/tasks/available-for-dependency?projectId=xxx&excludeTaskId=yyy
 * MUST COME BEFORE /:taskId ROUTES
 */
router.get(
  "/available-for-dependency",
  extractTasksContext,
  requireOrgMembership(),
  taskController.getAvailableTasksForDependency
);

/**
 * =========================================
 * PARAMETERIZED TASK ROUTES
 * KEEP THESE LAST
 * =========================================
 */

/**
 * PARAM MIDDLEWARE
 */
router.use(
  "/:taskId",
  taskMiddleware.loadTask,
  requireOrgMembership()
);

/**
 * GET TASK BY ID
 * GET /api/tasks/:taskId
 */
router.get(
  "/:taskId",
  taskController.getTaskById
);

/**
 * UPDATE TASK
 * PATCH /api/tasks/:taskId
 */
router.patch(
  "/:taskId",
  validate(updateTaskSchema),
  taskController.updateTask
);

/**
 * DELETE TASK
 * DELETE /api/tasks/:taskId
 */
router.delete(
  "/:taskId",
  taskController.deleteTask
);

module.exports = router;