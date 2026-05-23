const { prisma } = require("../../lib/prisma");

/**
 * Create a new project record.
 */
const createProject = async ({ orgId, ownerId, teamId, name, slug, description, status, startDate, dueDate }) =>
  prisma.project.create({
    data: {
      orgId,
      ownerId,
      teamId: teamId ?? null,
      name,
      slug: slug ?? null,
      description: description ?? null,
      status: status ?? "ACTIVE",
      startDate: startDate ?? null,
      dueDate: dueDate ?? null,
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      organization: { select: { id: true, name: true, slug: true } },
    },
  });

/**
 * Find a project by its ID.
 */
const findProjectById = async (id) =>
  prisma.project.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      organization: { select: { id: true, name: true, slug: true } },
    },
  });

/**
 * List all projects from organizations the user is a member of.
 * Optionally filter by orgId.
 */
const listProjectsForUser = async ({ userId, orgId }) => {
  // Fetch org IDs the user belongs to
  const memberships = await prisma.membership.findMany({
    where: { userId },
    select: { orgId: true },
  });

  const allowedOrgIds = memberships.map((m) => m.orgId);

  // If filtering by a specific org, make sure user belongs to it
  const whereOrgId =
    orgId && allowedOrgIds.includes(orgId) ? orgId : undefined;

  return prisma.project.findMany({
    where: {
      orgId: whereOrgId ?? { in: allowedOrgIds },
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      organization: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

/**
 * Update a project by ID.
 */
const updateProject = async (id, data) =>
  prisma.project.update({
    where: { id },
    data,
    include: {
      owner: { select: { id: true, name: true, email: true } },
      organization: { select: { id: true, name: true, slug: true } },
    },
  });

/**
 * Delete a project by ID.
 */
const deleteProject = async (id) =>
  prisma.project.delete({ where: { id } });

module.exports = {
  createProject,
  findProjectById,
  listProjectsForUser,
  updateProject,
  deleteProject,
};
