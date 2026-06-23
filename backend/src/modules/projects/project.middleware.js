const { AppError } = require("../../utils/AppError");
const { findProjectById, getProjectMember } = require("./project.repository");
const { requireOrgMembership } = require("../organizations/organization.middleware");

function canManageProject(member) {
  return ["Tech Lead", "Owner", "Admin"].includes(member?.role ?? "");
}

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

  // TEMP DEBUG: project access gate
  // eslint-disable-next-line no-console
  console.log("Project", projectId);

  if (!projectId) {
    // eslint-disable-next-line no-console
    console.log("401 reason", "projectId is required");
    return next(new AppError("projectId is required", 400));
  }

  const project = await findProjectById(projectId);
  if (!project) {
    // eslint-disable-next-line no-console
    console.log("401 reason", "Project not found");
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
  // allow OWNER/ADMIN org roles OR a project LEAD to perform certain actions
  requireOrgRoleOrProjectLead: (roles) => async (req, res, next) => {
    // if org role is present and allowed, permit
    if (req.orgRole && Array.isArray(roles) && roles.includes(req.orgRole)) {
      return next();
    }

    // otherwise, check project membership role
    const actorId = req.auth?.userId;
    if (!actorId || !req.project) {
      return next(new AppError("Insufficient permissions", 403));
    }

    try {
      const member = await getProjectMember(req.project.id, actorId);
      if (member && canManageProject(member)) {
        return next();
      }
    } catch (err) {
      // fall through to error
    }

    return next(new AppError("Insufficient permissions", 403));
  },
};
