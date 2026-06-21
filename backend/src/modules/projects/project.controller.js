const { asyncHandler } = require("../../utils/async-handler");
const {
  createProjectService,
  listProjectsService,
  getProjectService,
  updateProjectService,
  deleteProjectService,
  listProjectMembersService,
  addProjectMemberService,
  updateProjectMemberService,
  removeProjectMemberService,
} = require("./project.service");

/**
 * POST /api/projects
 * Body: { orgId, name, slug?, description?, status?, teamId?, startDate?, dueDate? }
 */
const create = asyncHandler(async (req, res) => {
  const project = await createProjectService({
    userId: req.auth.userId,
    orgId: req.body.orgId,
    name: req.body.name,
    slug: req.body.slug,
    description: req.body.description,
    status: req.body.status,
    teamId: req.body.teamId,
    startDate: req.body.startDate,
    dueDate: req.body.dueDate,
    category: req.body.category,
    priority: req.body.priority,
    goal: req.body.goal,
    expectedDeliverable: req.body.expectedDeliverable,
    estimatedDuration: req.body.estimatedDuration,
    leadId: req.body.leadId,
  });
  res.status(201).json({ data: project });
});

/**
 * GET /api/projects
 * Query params: ?orgId=<uuid> (optional — filters to a specific org)
 */
const list = asyncHandler(async (req, res) => {
  const projects = await listProjectsService({
    userId: req.auth.userId,
    orgId: req.query.orgId,
  });
  res.status(200).json({ data: projects });
});

/**
 * GET /api/projects/:id
 */
const getById = asyncHandler(async (req, res) => {
  const project = await getProjectService({
    projectId: req.params.id,
    userId: req.auth.userId,
  });
  res.status(200).json({ data: project });
});

/**
 * PATCH /api/projects/:id
 * Body: { name?, slug?, description?, status?, teamId?, startDate?, dueDate? }
 */
const update = asyncHandler(async (req, res) => {
  const project = await updateProjectService({
    projectId: req.params.id,
    userId: req.auth.userId,
    data: req.body,
  });
  res.status(200).json({ data: project });
});

/**
 * DELETE /api/projects/:id
 */
const remove = asyncHandler(async (req, res) => {
  await deleteProjectService({
    projectId: req.params.id,
    userId: req.auth.userId,
  });
  res.status(204).send();
});

const listMembers = asyncHandler(async (req, res) => {
  const members = await listProjectMembersService({
    projectId: req.params.id,
    userId: req.auth.userId,
  });
  res.status(200).json({ data: members });
});

const addMember = asyncHandler(async (req, res) => {
  const member = await addProjectMemberService({
    projectId: req.params.id,
    userId: req.auth.userId,
    actorId: req.auth.userId,
    data: req.body,
  });
  res.status(201).json({ data: member });
});

const updateMember = asyncHandler(async (req, res) => {
  const member = await updateProjectMemberService({
    projectId: req.params.id,
    userId: req.params.userId,
    actorId: req.auth.userId,
    data: req.body,
  });
  res.status(200).json({ data: member });
});

const removeMember = asyncHandler(async (req, res) => {
  const result = await removeProjectMemberService({
    projectId: req.params.id,
    userId: req.params.userId,
    actorId: req.auth.userId,
  });
  res.status(200).json({ data: result });
});

module.exports = {
  create,
  list,
  getById,
  update,
  remove,
  listMembers,
  addMember,
  updateMember,
  removeMember,
};
