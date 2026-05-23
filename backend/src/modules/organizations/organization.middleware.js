const { AppError } = require("../../utils/AppError");
const { getOrganizationById, getMembership } = require("./organization.repository");

const requireOrgMembership = () => async (req, res, next) => {
  const orgId = req.orgId ?? req.params.id;
  const userId = req.auth?.userId;

  if (typeof orgId !== "string" || typeof userId !== "string") {
    return next(new AppError("Organization access denied", 403));
  }

  const membership = await getMembership({ orgId, userId });
  if (!membership) {
    return next(new AppError("Organization access denied", 403));
  }

  const organization = await getOrganizationById(orgId);
  if (!organization) {
    return next(new AppError("Organization not found", 404));
  }

  req.org = organization;
  req.orgRole = membership.role;
  return next();
};

const requireOrgRole = (roles) => async (req, res, next) => {
  if (!req.orgRole || !roles.includes(req.orgRole)) {
    return next(new AppError("Insufficient organization role", 403));
  }
  return next();
};

module.exports = { requireOrgMembership, requireOrgRole };
