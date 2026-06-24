const { getMembership } = require("../modules/organizations/organization.repository");
const { hasPermission } = require("../lib/permissions");

const requirePermission = (permission) => async (req, res, next) => {
  const userId = req.auth?.userId;
  const orgId = req.orgId ?? req.params?.id ?? req.params?.orgId ?? req.body?.orgId ?? req.body?.organizationId ?? req.query?.orgId ?? req.query?.organizationId ?? req.org?.id ?? req.auth?.activeOrgId ?? null;

  if (typeof userId !== "string" || typeof orgId !== "string") {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions",
    });
  }

  const membership = req.orgRole && req.orgId === orgId
    ? { role: req.orgRole }
    : await getMembership({ orgId, userId });

  if (!membership || !hasPermission(membership.role, permission)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions",
    });
  }

  req.orgRole = membership.role;
  req.orgId = orgId;
  return next();
};

const requirePermissionIfBodyField = (permission, fieldName) => async (req, res, next) => {
  const value = req.body?.[fieldName];
  if (value === undefined || value === null || value === "") {
    return next();
  }
  return requirePermission(permission)(req, res, next);
};

module.exports = { requirePermission, requirePermissionIfBodyField };
