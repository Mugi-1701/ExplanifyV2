const {
  findUserByEmail,
  findUserById,
  createUser,
  updateLastLogin,
  createOrganizationWithOwner,
  findMembershipRole,
  createRefreshToken,
  revokeRefreshToken,
  findRefreshTokenById,
} = require("./auth.repository");
const {
  hashPassword,
  verifyPassword,
  createAccessToken,
  createRefreshJwt,
  generateRefreshTokenPair,
  hashRefreshToken,
  verifyRefreshToken,
  slugify,
  verifyRefreshJwt,
  parseExpiresToMs,
} = require("./auth.utils");
const { env } = require("../../config/env");
const { AppError } = require("../../utils/AppError");

const signup = async ({ email, name, password, orgName }) => {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new AppError("Email already in use", 409);
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser({ email, name, passwordHash });

  let organization = null;
  if (orgName) {
    const slugBase = slugify(orgName);
    const slug = `${slugBase}-${user.id.slice(0, 6)}`;
    organization = await createOrganizationWithOwner({
      name: orgName,
      slug,
      userId: user.id,
    });
  }

  const { accessToken, refreshToken } = await issueTokens({
    user,
    activeOrgId: organization?.id,
  });

  return { user, organization, accessToken, refreshToken };
};

const login = async ({ email, password, activeOrgId }) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const matches = await verifyPassword(password, user.passwordHash);
  if (!matches) {
    throw new AppError("Invalid credentials", 401);
  }

  // If no explicit activeOrgId is provided during login, try to automatically
  // assign one from the user's existing memberships to populate JWT context
  let resolvedOrgId = activeOrgId;
  const { prisma } = require("../../lib/prisma"); // Direct require for membership lookup
  
  if (!resolvedOrgId) {
    const firstMembership = await prisma.membership.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' } // prefer oldest/primary org
    });
    if (firstMembership) {
      resolvedOrgId = firstMembership.orgId;
    }
  }

  await updateLastLogin(user.id);

  const { accessToken, refreshToken } = await issueTokens({ user, activeOrgId: resolvedOrgId });

  return { user, accessToken, refreshToken };
};

const issueTokens = async ({ user, activeOrgId }) => {
  let orgRole = null;
  if (activeOrgId) {
    const membership = await findMembershipRole({ userId: user.id, orgId: activeOrgId });
    orgRole = membership?.role || null;
  }

  const accessToken = createAccessToken({
    userId: user.id,
    email: user.email,
    activeOrgId,
    orgRole,
  });

  const { tokenId, tokenSecret, rawToken } = generateRefreshTokenPair();
  const refreshToken = createRefreshJwt({ userId: user.id, tokenId });
  const tokenHash = await hashRefreshToken(refreshToken);
  const expiresMs = parseExpiresToMs(env.jwtRefreshExpires) || 7 * 24 * 60 * 60 * 1000;
  const expiresAt = new Date(Date.now() + expiresMs);

  await createRefreshToken({ id: tokenId, userId: user.id, tokenHash, expiresAt });

  return { accessToken, refreshToken };
};

const refreshAccessToken = async ({ refreshToken }) => {
  let payload;
  try {
    payload = verifyRefreshJwt(refreshToken);
  } catch (error) {
    throw new AppError("Invalid refresh token", 401);
  }

  const tokenId = payload.jti;
  if (!tokenId || payload.type !== "refresh") {
    throw new AppError("Invalid refresh token", 401);
  }

  const stored = await findRefreshTokenById(tokenId);
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new AppError("Refresh token expired", 401);
  }

  const verified = await verifyRefreshToken(refreshToken, stored.tokenHash);
  if (!verified) {
    throw new AppError("Refresh token invalid", 401);
  }

  await revokeRefreshToken(stored.id);

  const user = await findUserById(stored.userId);
  if (!user) {
    throw new AppError("User not found", 401);
  }
  
  const { prisma } = require("../../lib/prisma"); // Direct require for membership lookup
  
  // Restore organization context based on user memberships
  const firstMembership = await prisma.membership.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' } 
  });
  
  const activeOrgId = firstMembership ? firstMembership.orgId : undefined;

  const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await issueTokens({
    user,
    activeOrgId,
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

module.exports = {
  signup,
  login,
  refreshAccessToken,
};
