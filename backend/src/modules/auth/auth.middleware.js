const jwt = require("jsonwebtoken");
const { env } = require("../../config/env");
const { findMembershipRole } = require("./auth.repository");
const { AppError } = require("../../utils/AppError");

const authenticate = () => async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(new AppError("Missing access token", 401));
  }

  const token = header.replace("Bearer ", "");

  try {
    const payload = jwt.verify(token, env.jwtAccessSecret);
    req.auth = {
      userId: payload.sub,
      email: payload.email,
      activeOrgId: payload.activeOrgId || null,
      orgRole: payload.orgRole || null,
    };
    return next();
  } catch (error) {
    return next(new AppError("Invalid access token", 401));
  }
};

const requireOrgRole = (roles) => async (req, res, next) => {
  if (!req.auth?.activeOrgId) {
    return next(new AppError("Missing active organization", 403));
  }

  const membership = await findMembershipRole({
    userId: req.auth.userId,
    orgId: req.auth.activeOrgId,
  });

  if (!membership || !roles.includes(membership.role)) {
    return next(new AppError("Insufficient organization role", 403));
  }

  return next();
};

module.exports = {
  authenticate,
  requireOrgRole,
};
