const { asyncHandler } = require("../../utils/async-handler");
const { signup, login, refreshAccessToken } = require("./auth.service");
const { sanitizeUser } = require("./auth.utils");
const { signupSchema, loginSchema, refreshSchema } = require("./auth.validation");
const { findUserById } = require("./auth.repository");

const signupHandler = asyncHandler(async (req, res) => {
  const result = await signup(req.body);
  res.status(201).json({
    data: {
      user: sanitizeUser(result.user),
      organization: result.organization,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
  });
});

const loginHandler = asyncHandler(async (req, res) => {
  const activeOrgId = req.headers["x-org-id"];
  const result = await login({ ...req.body, activeOrgId });
  res.status(200).json({
    data: {
      user: sanitizeUser(result.user),
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
  });
});

const refreshHandler = asyncHandler(async (req, res) => {
  const result = await refreshAccessToken(req.body);
  res.status(200).json({ data: result });
});

const meHandler = asyncHandler(async (req, res) => {
  const user = await findUserById(req.auth.userId);
  res.status(200).json({
    data: {
      user: sanitizeUser(user),
      session: req.auth,
    },
  });
});

module.exports = {
  signupHandler,
  loginHandler,
  refreshHandler,
  meHandler,
};
