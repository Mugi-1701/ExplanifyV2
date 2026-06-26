const express = require("express");
const { authenticate } = require("../../auth/auth.middleware");
const { loadProject } = require("../../projects/project.middleware");
const { requireOrgMembership } = require("../../organizations/organization.middleware");
const { getProjectWorkload } = require("./workload.controller");

const router = express.Router();

router.get(
  "/workload/:projectId",
  authenticate(),
  loadProject(),
  requireOrgMembership(),
  getProjectWorkload
);

module.exports = router;
