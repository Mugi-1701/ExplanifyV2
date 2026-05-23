const { prisma } = require("../../lib/prisma");

const createOrganization = async ({ name, slug, ownerId }) =>
  prisma.organization.create({
    data: {
      name,
      slug,
      memberships: {
        create: {
          userId: ownerId,
          role: "OWNER",
        },
      },
    },
  });

const listOrganizationsByUser = async (userId) =>
  prisma.organization.findMany({
    where: {
      memberships: {
        some: { userId },
      },
    },
    orderBy: { createdAt: "desc" },
  });

const getOrganizationById = async (id) =>
  prisma.organization.findUnique({
    where: { id },
  });

const updateOrganization = async ({ id, name, slug }) =>
  prisma.organization.update({
    where: { id },
    data: {
      name,
      slug,
    },
  });

const deleteOrganization = async (id) => {
  return prisma.$transaction(async (tx) => {
    await tx.membership.deleteMany({
      where: {
        orgId: id,
      },
    });

    return tx.organization.delete({
      where: {
        id,
      },
    });
  });
};

const getMembership = async ({ orgId, userId }) => {
  if (!orgId || !userId) return null;
  return prisma.membership.findUnique({
    where: {
      orgId_userId: { orgId, userId },
    },
  });
};

const addMember = async ({ orgId, userId, role }) =>
  prisma.membership.create({
    data: { orgId, userId, role },
  });

const removeMember = async ({ orgId, userId }) =>
  prisma.membership.delete({
    where: { orgId_userId: { orgId, userId } },
  });

const createInvite = async ({ orgId, email, role, tokenHash, inviterId, expiresAt }) =>
  prisma.organizationInvite.create({
    data: {
      orgId,
      email,
      role,
      tokenHash,
      inviterId,
      expiresAt,
    },
  });

const listMembers = async (orgId) =>
  prisma.membership.findMany({
    where: { orgId },
    include: { user: true },
  });

module.exports = {
  createOrganization,
  listOrganizationsByUser,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  getMembership,
  addMember,
  removeMember,
  createInvite,
  listMembers,
};
