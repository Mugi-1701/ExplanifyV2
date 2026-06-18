const { AppError } = require("../../utils/AppError");
const { findProjectById } = require("./project.repository");
const { requireOrgMembership } = require("../organizations/organization.middleware");

const attachOrgIdFromBody = () => (req, res, next) => {
  if (req.body?.orgId) {
    req.orgId = req.body.orgId;
  }
  return next();
};

const attachOrgIdFromQuery = () => (req, res, next) => {
  if (req.query?.orgId) {
    req.orgId = req.query.orgId;
  }
  return next();
};

const requireOrgMembershipIfQuery = () => (req, res, next) => {
  if (!req.query?.orgId) {
    return next();
  }
  req.orgId = req.query.orgId;
  return requireOrgMembership()(req, res, next);
};

const loadProject = () => async (req, res, next) => {
  const projectId = req.params.projectId ?? req.params.id;

  if (!projectId) {
    return next(new AppError("projectId is required", 400));
  }

  const project = await findProjectById(projectId);
  if (!project) {
    return next(new AppError("Project not found", 404));
  }

  req.project = project;
  req.orgId = project.orgId;
  return next();
};

module.exports = {
  attachOrgIdFromBody,
  attachOrgIdFromQuery,
  requireOrgMembershipIfQuery,
  loadProject,
};
