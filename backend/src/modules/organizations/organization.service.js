const {
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
} = require("./organization.repository");
const { AppError } = require("../../utils/AppError");
const { slugify } = require("../auth/auth.utils");
const { randomBytes } = require("crypto");
const bcrypt = require("bcryptjs");
const { recordEventSafely } = require("../events/service");

const createOrg = async ({ userId, name }) => {
  const slug = `${slugify(name)}-${userId.slice(0, 6)}`;
  return createOrganization({ name, slug, ownerId: userId });
};

const listMyOrgs = async ({ userId }) => listOrganizationsByUser(userId);

const getOrg = async ({ orgId, userId }) => {
  const membership = await getMembership({ orgId, userId });
  if (!membership) {
    throw new AppError("Organization access denied", 403);
  }
  const organization = await getOrganizationById(orgId);
  if (!organization) {
    throw new AppError("Organization not found", 404);
  }
  return organization;
};

const updateOrg = async ({ orgId, userId, name }) => {
  const membership = await getMembership({ orgId, userId });
  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    throw new AppError("Insufficient organization role", 403);
  }
  const slug = `${slugify(name)}-${orgId.slice(0, 6)}`;
  return updateOrganization({ id: orgId, name, slug });
};

const deleteOrg = async ({ orgId, userId }) => {
  const membership = await getMembership({ orgId, userId });
  if (!membership || membership.role !== "OWNER") {
    throw new AppError("Only owners can delete organizations", 403);
  }
  return deleteOrganization(orgId);
};

const inviteMember = async ({ orgId, userId, email, role, expiresInDays = 7 }) => {
  const membership = await getMembership({ orgId, userId });
  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    throw new AppError("Insufficient organization role", 403);
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = await bcrypt.hash(token, 12);
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  const invite = await createInvite({
    orgId,
    email,
    role,
    tokenHash,
    inviterId: userId,
    expiresAt,
  });

  return { invite, token };
};

const addMemberToOrg = async ({ orgId, userId, role, actorId }) => {
  const membership = await addMember({ orgId, userId, role });

  recordEventSafely({
    organizationId: orgId,
    userId: actorId,
    eventType: "MEMBER_ADDED",
    entityType: "OrganizationMember",
    entityId: membership.id,
    metadata: {
      role,
    },
  });

  return membership;
};

const removeMemberFromOrg = async ({ orgId, userId, memberId, actorId }) => {
  if (actorId === memberId) {
    throw new AppError("Cannot remove yourself", 400);
  }
  const removed = await removeMember({ orgId, userId: memberId });

  recordEventSafely({
    organizationId: orgId,
    userId: actorId,
    eventType: "MEMBER_REMOVED",
    entityType: "OrganizationMember",
    entityId: memberId,
    metadata: {
      memberId,
    },
  });

  return removed;
};

const listOrgMembers = async ({ orgId, userId }) => {
  const membership = await getMembership({ orgId, userId });
  if (!membership) {
    throw new AppError("Organization access denied", 403);
  }
  return listMembers(orgId);
};

module.exports = {
  createOrg,
  listMyOrgs,
  getOrg,
  updateOrg,
  deleteOrg,
  inviteMember,
  addMemberToOrg,
  removeMemberFromOrg,
  listOrgMembers,
};
