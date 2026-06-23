const jwt = require("jsonwebtoken");
const { env } = require("../../config/env");
const { findMembershipRole } = require("./auth.repository");
const { AppError } = require("../../utils/AppError");

const authenticate = () => async (req, res, next) => {
  const header = req.headers.authorization;
  // TEMP DEBUG: auth header visibility
  // eslint-disable-next-line no-console
  console.log("Authorization header", header);
  if (!header || !header.startsWith("Bearer ")) {
    // eslint-disable-next-line no-console
    console.log("401 reason", "Missing access token");
    return next(new AppError("Missing access token", 401));
  }

  const token = header.replace("Bearer ", "");

  try {
    const payload = jwt.verify(token, env.jwtAccessSecret);
    // eslint-disable-next-line no-console
    console.log("Decoded user", payload);
    req.auth = {
      userId: payload.sub,
      email: payload.email,
      activeOrgId: payload.activeOrgId || null,
      orgRole: payload.orgRole || null,
    };
    return next();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log("401 reason", "Invalid access token", {
      message: error?.message,
    });
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
