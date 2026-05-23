const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomBytes } = require("crypto");
const { env } = require("../../config/env");

const hashPassword = async (password) => bcrypt.hash(password, 12);
const verifyPassword = async (password, hash) => bcrypt.compare(password, hash);

const createAccessToken = ({ userId, email, activeOrgId, orgRole }) =>
  jwt.sign(
    {
      sub: userId,
      email,
      activeOrgId,
      orgRole,
    },
    env.jwtAccessSecret,
    { expiresIn: env.jwtAccessExpires }
  );

const createRefreshJwt = ({ userId, tokenId }) =>
  jwt.sign(
    {
      sub: userId,
      jti: tokenId,
      type: "refresh",
    },
    env.jwtRefreshSecret,
    { expiresIn: env.jwtRefreshExpires }
  );

const verifyRefreshJwt = (token) => jwt.verify(token, env.jwtRefreshSecret);

const generateRefreshTokenPair = () => {
  const tokenId = randomBytes(16).toString("hex");
  const tokenSecret = randomBytes(32).toString("hex");
  return { tokenId, tokenSecret, rawToken: `${tokenId}.${tokenSecret}` };
};

const hashRefreshToken = async (token) => bcrypt.hash(token, 12);
const verifyRefreshToken = async (token, hash) => bcrypt.compare(token, hash);

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const sanitizeUser = (user) => {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
};

const parseExpiresToMs = (value) => {
  const match = /^([0-9]+)([smhd])$/.exec(value);
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = match[2];
  const multiplier = unit === "s" ? 1000 : unit === "m" ? 60000 : unit === "h" ? 3600000 : 86400000;
  return amount * multiplier;
};

module.exports = {
  hashPassword,
  verifyPassword,
  createAccessToken,
  createRefreshJwt,
  verifyRefreshJwt,
  generateRefreshTokenPair,
  hashRefreshToken,
  verifyRefreshToken,
  slugify,
  sanitizeUser,
  parseExpiresToMs,
};
