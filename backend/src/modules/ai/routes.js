const express = require("express");
const { authenticate } = require("../auth/auth.middleware");
const { loadProject } = require("../projects/project.middleware");
const { requireOrgMembership } = require("../organizations/organization.middleware");
const { validate } = require("../../middleware/validate");
const { recommendAssigneeParamsSchema, recommendAssigneeBodySchema, rebalanceSuggestionsSchema, kanbanInsightsParamsSchema } = require("./ai.validation");
const { recommendAssigneeHandler, getProjectWorkloadHandler, getRebalanceSuggestions, getKanbanInsightsHandler } = require("./ai.controller");
const workloadRoutes = require("./workload/workload.routes");

const router = express.Router();

router.post(
  "/projects/:projectId/ai/recommend-assignee",
  authenticate(),
  loadProject(),
  requireOrgMembership(),
  validate(recommendAssigneeParamsSchema, "params"),
  validate(recommendAssigneeBodySchema),
  recommendAssigneeHandler
);

router.get(
  "/projects/:projectId/ai/workload",
  authenticate(),
  loadProject(),
  requireOrgMembership(),
  getProjectWorkloadHandler
);

router.get(
  "/projects/:projectId/ai/rebalance",
  authenticate(),
  loadProject(),
  requireOrgMembership(),
  validate(rebalanceSuggestionsSchema, "params"),
  getRebalanceSuggestions
);

router.get(
  "/ai/kanban-insights/:projectId",
  authenticate(),
  loadProject(),
  requireOrgMembership(),
  validate(kanbanInsightsParamsSchema, "params"),
  getKanbanInsightsHandler
);

router.use("/", workloadRoutes);

module.exports = router;
