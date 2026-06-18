const { AppError } = require("../../utils/AppError");
const { slugify } = require("../auth/auth.utils");
const { getMembership } = require("../organizations/organization.repository");
const {
  createProject,
  findProjectById,
  listProjectsForUser,
  updateProject,
  deleteProject,
  listProjectMembers,
  getProjectMember,
  addProjectMember,
  updateProjectMember,
  removeProjectMember,
  getProjectTaskCountsByAssignee,
} = require("./project.repository");

const EMPTY_STATS = {
  taskCount: 0,
  completedTaskCount: 0,
  blockedTaskCount: 0,
  activeTaskCount: 0,
  progressPercentage: 0,
  coordinationHealth: "EMPTY",
  coordinationReason: "No tasks yet",
};

const calculateProgressPercentage = (tasks = []) => {
  const totalTasks = tasks.length;
  if (totalTasks === 0) {
    return 0;
  }

  const completedTasks = tasks.filter((task) => task.status === "DONE").length;
  return Math.round((completedTasks / totalTasks) * 100);
};

const assertMembership = async ({ orgId, userId }) => {
  const membership = await getMembership({ orgId, userId });
  if (!membership) {
    throw new AppError("You are not a member of this organization", 403);
  }
  return membership;
};

const assertAdminRole = async ({ orgId, userId }) => {
  const membership = await assertMembership({ orgId, userId });
  if (!["OWNER", "ADMIN"].includes(membership.role)) {
    throw new AppError("Insufficient permissions - OWNER or ADMIN required", 403);
  }
  return membership;
};

const isTaskBlocked = (task) => {
  if (task.status === "BLOCKED") {
    return true;
  }

  const dependencies = Array.isArray(task.dependencies) ? task.dependencies : [];
  return dependencies.some((dependency) => dependency.dependsOnTask?.status !== "DONE");
};

const buildProjectStats = (tasks = []) => {
  const taskCount = tasks.length;

  if (taskCount === 0) {
    return EMPTY_STATS;
  }

  const completedTaskCount = tasks.filter((task) => task.status === "DONE").length;
  const blockedTaskCount = tasks.filter(isTaskBlocked).length;
  const activeTaskCount = tasks.filter((task) => task.status === "IN_PROGRESS").length;
  const progressPercentage = calculateProgressPercentage(tasks);

  if (blockedTaskCount > 0) {
    return {
      taskCount,
      completedTaskCount,
      blockedTaskCount,
      activeTaskCount,
      progressPercentage,
      coordinationHealth: "BLOCKED",
      coordinationReason: `${blockedTaskCount} task${blockedTaskCount === 1 ? " is" : "s are"} waiting on dependencies`,
    };
  }

  if (completedTaskCount === taskCount) {
    return {
      taskCount,
      completedTaskCount,
      blockedTaskCount,
      activeTaskCount,
      progressPercentage,
      coordinationHealth: "HEALTHY",
      coordinationReason: "All dependencies completed",
    };
  }

  if (activeTaskCount > 0) {
    return {
      taskCount,
      completedTaskCount,
      blockedTaskCount,
      activeTaskCount,
      progressPercentage,
      coordinationHealth: "READY",
      coordinationReason: "Active execution in progress",
    };
  }

  return {
    taskCount,
    completedTaskCount,
    blockedTaskCount,
    activeTaskCount,
    progressPercentage,
    coordinationHealth: "READY",
    coordinationReason: "Ready to start",
  };
};

const attachStats = (project) => {
  if (!project) {
    return project;
  }

  const { tasks = [], ...projectData } = project;
  const stats = buildProjectStats(tasks);
  return {
    ...projectData,
    progressPercentage: stats.progressPercentage,
    stats,
    members: project.members ?? [],
    tasks,
  };
};

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
  await assertMembership({ orgId, userId });

  const resolvedSlug = slug ?? `${slugify(name)}-${Date.now().toString(36)}`;

  const project = await createProject({
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

  return attachStats(project);
};

const listProjectsService = async ({ userId, orgId }) => {
  const projects = await listProjectsForUser({ userId, orgId });
  return projects.map(attachStats);
};

const getProjectService = async ({ projectId, userId }) => {
  const project = await findProjectById(projectId);
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  await assertMembership({ orgId: project.orgId, userId });

  return attachStats(project);
};

const updateProjectService = async ({ projectId, userId, data }) => {
  const project = await findProjectById(projectId);
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  await assertAdminRole({ orgId: project.orgId, userId });

  const updateData = { ...data };
  if (data.name && !data.slug) {
    updateData.slug = `${slugify(data.name)}-${Date.now().toString(36)}`;
  }

  const updatedProject = await updateProject(projectId, updateData);
  return attachStats(updatedProject);
};

const listProjectMembersService = async ({ projectId, userId }) => {
  const project = await findProjectById(projectId);
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  await assertMembership({ orgId: project.orgId, userId });

  const [members, taskCounts] = await Promise.all([
    listProjectMembers(projectId),
    getProjectTaskCountsByAssignee(projectId),
  ]);

  return members.map((member) => ({
    ...member,
    ...taskCounts.get(member.userId),
  }));
};

const addProjectMemberService = async ({ projectId, userId, actorId, data }) => {
  const project = await findProjectById(projectId);
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  await assertAdminRole({ orgId: project.orgId, userId: actorId });

  const existingMember = await getProjectMember(projectId, data.userId);
  if (existingMember) {
    throw new AppError("Project member already exists", 409);
  }

  const role = data.role || "MEMBER";
  return addProjectMember({
    projectId,
    userId: data.userId,
    role,
    skills: data.skills ?? [],
  });
};

const updateProjectMemberService = async ({ projectId, userId, actorId, data }) => {
  const project = await findProjectById(projectId);
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  await assertAdminRole({ orgId: project.orgId, userId: actorId });

  const existingMember = await getProjectMember(projectId, userId);
  if (!existingMember) {
    throw new AppError("Project member not found", 404);
  }

  const updateData = {};
  if (data.role !== undefined) {
    updateData.role = data.role;
  }
  if (data.skills !== undefined) {
    updateData.skills = data.skills;
  }

  return updateProjectMember(projectId, userId, updateData);
};

const removeProjectMemberService = async ({ projectId, userId, actorId }) => {
  const project = await findProjectById(projectId);
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  await assertAdminRole({ orgId: project.orgId, userId: actorId });

  const existingMember = await getProjectMember(projectId, userId);
  if (!existingMember) {
    throw new AppError("Project member not found", 404);
  }

  await removeProjectMember(projectId, userId);
  return { message: "Project member removed successfully" };
};

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
  listProjectMembersService,
  addProjectMemberService,
  updateProjectMemberService,
  removeProjectMemberService,
};
