const { AppError } = require("../../utils/AppError");

function getWorkspaceId(req) {
  return req.orgId ?? req.auth?.activeOrgId ?? null;
}

function assertWorkspaceId(req) {
  const workspaceId = getWorkspaceId(req);
  if (!workspaceId) {
    throw new AppError("Missing workspace context", 403);
  }
  return workspaceId;
}

module.exports = { getWorkspaceId, assertWorkspaceId };
