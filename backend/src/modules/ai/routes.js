const express = require("express");
const { authenticate } = require("../auth/auth.middleware");
const { loadProject } = require("../projects/project.middleware");
const { requireOrgMembership } = require("../organizations/organization.middleware");
const { validate } = require("../../middleware/validate");
const { recommendAssigneeSchema } = require("./validation");
const { recommendAssigneeHandler } = require("./controller");

const router = express.Router();

router.post(
  "/projects/:projectId/ai/recommend-assignee",
  authenticate(),
  loadProject(),
  requireOrgMembership(),
  validate(recommendAssigneeSchema),
  recommendAssigneeHandler
);

module.exports = router;
