const { AppError } = require("../../utils/AppError");
const { slugify } = require("../auth/auth.utils");
const { getMembership } = require("../organizations/organization.repository");
const {
  createProject,
  findProjectById,
  listProjectsForUser,
  updateProject,
  deleteProject,
} = require("./project.repository");

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Assert user is a member of the org the project belongs to.
 * Returns the membership record.
 */
const assertMembership = async ({ orgId, userId }) => {
  const membership = await getMembership({ orgId, userId });
  if (!membership) {
    throw new AppError("You are not a member of this organization", 403);
  }
  return membership;
};

/**
 * Assert user holds OWNER or ADMIN role in the project's org.
 */
const assertAdminRole = async ({ orgId, userId }) => {
  const membership = await assertMembership({ orgId, userId });
  if (!["OWNER", "ADMIN"].includes(membership.role)) {
    throw new AppError("Insufficient permissions — OWNER or ADMIN required", 403);
  }
  return membership;
};

// ─── Service Functions ───────────────────────────────────────────────────────

/**
 * POST /api/projects
 * Create a new project scoped to an organization.
 */
const createProjectService = async ({
  userId,
  orgId,
  name,
  slug,
  description,
  status,
  teamId,
  startDate,
  dueDate,
}) => {
  // User must be a member of the target org
  await assertMembership({ orgId, userId });

  // Auto-generate slug from name if not provided
  const resolvedSlug = slug ?? `${slugify(name)}-${Date.now().toString(36)}`;

  return createProject({
    orgId,
    ownerId: userId,
    teamId,
    name,
    slug: resolvedSlug,
    description,
    status,
    startDate,
    dueDate,
  });
};

/**
 * GET /api/projects
 * List all projects the authenticated user has access to.
 * Optionally scoped to a specific org via query param ?orgId=...
 */
const listProjectsService = async ({ userId, orgId }) =>
  listProjectsForUser({ userId, orgId });

/**
 * GET /api/projects/:id
 * Fetch a single project — user must belong to the project's org.
 */
const getProjectService = async ({ projectId, userId }) => {
  const project = await findProjectById(projectId);
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  // Verify user belongs to the project's organization
  await assertMembership({ orgId: project.orgId, userId });

  return project;
};

/**
 * PATCH /api/projects/:id
 * Update a project — user must be OWNER or ADMIN of the project's org.
 */
const updateProjectService = async ({ projectId, userId, data }) => {
  const project = await findProjectById(projectId);
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  await assertAdminRole({ orgId: project.orgId, userId });

  // If name changes and slug was not explicitly provided, regenerate slug
  const updateData = { ...data };
  if (data.name && !data.slug) {
    updateData.slug = `${slugify(data.name)}-${Date.now().toString(36)}`;
  }

  return updateProject(projectId, updateData);
};

/**
 * DELETE /api/projects/:id
 * Delete a project — user must be OWNER or ADMIN of the project's org.
 */
const deleteProjectService = async ({ projectId, userId }) => {
  const project = await findProjectById(projectId);
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  await assertAdminRole({ orgId: project.orgId, userId });

  return deleteProject(projectId);
};

module.exports = {
  createProjectService,
  listProjectsService,
  getProjectService,
  updateProjectService,
  deleteProjectService,
};
