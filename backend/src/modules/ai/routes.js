const express = require("express");
const { authenticate } = require("../auth/auth.middleware");
const { loadProject } = require("../projects/project.middleware");
const { requireOrgMembership } = require("../organizations/organization.middleware");
const { validate } = require("../../middleware/validate");
const { recommendAssigneeParamsSchema, recommendAssigneeBodySchema, rebalanceSuggestionsSchema } = require("./ai.validation");
const { recommendAssigneeHandler, getProjectWorkloadHandler, getRebalanceSuggestions } = require("./ai.controller");

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

module.exports = router;
