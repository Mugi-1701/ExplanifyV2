const { prisma } = require("../../lib/prisma");

const findUserByEmail = async (email) =>
  prisma.user.findUnique({ where: { email } });

const findUserById = async (id) =>
  prisma.user.findUnique({ where: { id } });

const createUser = async ({ email, name, passwordHash }) =>
  prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
    },
  });

const updateLastLogin = async (id) =>
  prisma.user.update({
    where: { id },
    data: { lastLoginAt: new Date() },
  });

const createOrganizationWithOwner = async ({ name, slug, userId }) =>
  prisma.organization.create({
    data: {
      name,
      slug,
      memberships: {
        create: {
          userId,
          role: "OWNER",
        },
      },
    },
  });

const findMembershipRole = async ({ userId, orgId }) =>
  prisma.membership.findUnique({
    where: {
      orgId_userId: {
        orgId,
        userId,
      },
    },
  });

const createRefreshToken = async ({ id, userId, tokenHash, expiresAt }) =>
  prisma.refreshToken.create({
    data: {
      id,
      userId,
      tokenHash,
      expiresAt,
    },
  });

const revokeRefreshToken = async (id) =>
  prisma.refreshToken.update({
    where: { id },
    data: { revokedAt: new Date() },
  });

const findRefreshTokenById = async (id) =>
  prisma.refreshToken.findUnique({ where: { id } });

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  updateLastLogin,
  createOrganizationWithOwner,
  findMembershipRole,
  createRefreshToken,
  revokeRefreshToken,
  findRefreshTokenById,
};
