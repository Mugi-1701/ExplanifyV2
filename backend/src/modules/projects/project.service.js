const { AppError } = require("../../utils/AppError");
const { slugify } = require("../auth/auth.utils");
const { getMembership } = require("../organizations/organization.repository");
const { recordEventSafely } = require("../events/service");
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
  normalizeProjectRole,
} = require("./project.repository");
const { prisma } = require("../../lib/prisma");
const { getRoleById } = require("../catalog/roles.repository");
const { getSkillById } = require("../catalog/skills.repository");

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
  const dto = {
    ...projectData,
    progressPercentage: stats.progressPercentage,
    stats,
    members: project.members ?? [],
    tasks,
  };

  return dto;
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
  category,
  priority,
  goal,
  expectedDeliverable,
  estimatedDuration,
  leadId,
}) => {
  await assertMembership({ orgId, userId });

  const resolvedSlug = slug ?? `${slugify(name)}-${Date.now().toString(36)}`;

  const project = await createProject({
    orgId,
    ownerId: userId,
    teamId: teamId ?? null,
    name,
    slug: resolvedSlug,
    description,
    status,
    startDate,
    dueDate,
  });

  recordEventSafely({
    organizationId: orgId,
    userId,
    projectId: project.id,
    eventType: "PROJECT_CREATED",
    entityType: "Project",
    entityId: project.id,
    metadata: {
      name,
      slug: resolvedSlug,
      status: status ?? "ACTIVE",
      projectName: name,
      category,
      priority,
      goal,
      expectedDeliverable,
      estimatedDuration,
      leadId,
    },
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

  recordEventSafely({
    organizationId: project.orgId,
    userId,
    projectId,
    eventType: "PROJECT_UPDATED",
    entityType: "Project",
    entityId: projectId,
    metadata: {
      changes: updateData,
      projectName: updatedProject.name ?? project.name,
    },
  });

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
    roleId: member.roleId ?? null,
    role: formatProjectRoleLabel(member.roleRef?.name ?? member.role),
    skillIds:
      Array.isArray(member.memberSkills) && member.memberSkills.length > 0
        ? member.memberSkills.map((entry) => entry.skillId)
        : [],
    skills:
      Array.isArray(member.memberSkills) && member.memberSkills.length > 0
        ? member.memberSkills.map((entry) => entry.skill?.name).filter(Boolean)
        : member.skills ?? [],
    ...taskCounts.get(member.userId),
  }));
};

function getMemberRole(member) {
  return member?.role ?? null;
}

function formatProjectRoleLabel(role) {
  switch (normalizeProjectRole(role)) {
    case "OWNER":
      return "Owner";
    case "LEAD":
      return "Lead";
    default:
      return "Member";
  }
}

function canManageProject(member) {
  return ["Tech Lead", "Owner", "Admin"].includes(getMemberRole(member) ?? "");
}

async function resolveRoleName({ workspaceId, roleId, role }) {
  if (roleId) {
    const roleRecord = await getRoleById(roleId);
    if (!roleRecord || roleRecord.workspaceId !== workspaceId) {
      throw new AppError("Role not found", 404);
    }
    return { roleId: roleRecord.id, role: formatProjectRoleLabel(roleRecord.name) };
  }
  return { roleId: null, role: formatProjectRoleLabel(role) };
}

async function resolveSkills({ workspaceId, skillIds = [] }) {
  if (!Array.isArray(skillIds) || skillIds.length === 0) {
    return { skillIds: [], skills: [] };
  }

  const uniqueSkillIds = [...new Set(skillIds)];
  const records = await Promise.all(uniqueSkillIds.map((id) => getSkillById(id)));
  const invalid = records.find((record) => !record || record.workspaceId !== workspaceId);
  if (invalid) {
    throw new AppError("Skill not found", 404);
  }

  return {
    skillIds: uniqueSkillIds,
    skills: records.filter(Boolean).map((record) => record.name),
  };
}

const addProjectMemberService = async ({ projectId, userId, actorId, data }) => {
  const project = await findProjectById(projectId);
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  // allow org OWNER/ADMIN or project LEAD to manage members
  const canManage = async () => {
    const membership = await getMembership({ orgId: project.orgId, userId: actorId });
    if (membership && ["OWNER", "ADMIN"].includes(membership.role)) return true;
    const projMember = await getProjectMember(projectId, actorId);
    if (projMember && canManageProject(projMember)) return true;
    return false;
  };

  if (!(await canManage())) {
    throw new AppError("Insufficient permissions - OWNER, ADMIN, or PROJECT LEAD required", 403);
  }

  const existingMember = await getProjectMember(projectId, data.userId);
  if (existingMember) {
    throw new AppError("Project member already exists", 409);
  }

  const { roleId, role } = await resolveRoleName({
    workspaceId: project.orgId,
    roleId: data.roleId,
    role: data.role,
  });
  const { skillIds, skills } = await resolveSkills({ workspaceId: project.orgId, skillIds: data.skillIds ?? [] });
  const member = await addProjectMember({
    projectId,
    userId: data.userId,
    roleId,
    role,
    skillIds,
    skills,
  });

  recordEventSafely({
    organizationId: project.orgId,
    userId: actorId,
    projectId,
    eventType: "MEMBER_ADDED",
    entityType: "ProjectMember",
    entityId: member.id,
    metadata: {
      memberId: data.userId,
      memberName: member.user?.name ?? null,
      roleId,
      role,
      skillIds,
      skills,
    },
  });

  return member;
};

const updateProjectMemberService = async ({ projectId, userId, actorId, data }) => {
  const project = await findProjectById(projectId);
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  // allow org OWNER/ADMIN or project LEAD to manage members
  const canManage = async () => {
    const membership = await getMembership({ orgId: project.orgId, userId: actorId });
    if (membership && ["OWNER", "ADMIN"].includes(membership.role)) return true;
    const projMember = await getProjectMember(projectId, actorId);
    if (projMember && canManageProject(projMember)) return true;
    return false;
  };

  if (!(await canManage())) {
    throw new AppError("Insufficient permissions - OWNER, ADMIN, or PROJECT LEAD required", 403);
  }

  const existingMember = await getProjectMember(projectId, userId);
  if (!existingMember) {
    throw new AppError("Project member not found", 404);
  }

  const updateData = {};
  if (data.roleId !== undefined || data.role !== undefined) {
    const resolvedRole = await resolveRoleName({
      workspaceId: project.orgId,
      roleId: data.roleId ?? null,
      role: data.role,
    });
    updateData.roleId = resolvedRole.roleId;
    updateData.role = resolvedRole.role;
  }
  if (data.skillIds !== undefined) {
    const resolvedSkills = await resolveSkills({ workspaceId: project.orgId, skillIds: data.skillIds });
    updateData.skills = resolvedSkills.skills;
    updateData.skillIds = resolvedSkills.skillIds;
  }

  return updateProjectMember(projectId, userId, updateData);
};

const removeProjectMemberService = async ({ projectId, userId, actorId }) => {
  const project = await findProjectById(projectId);
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  // allow org OWNER/ADMIN or project LEAD to manage members
  const canManage = async () => {
    const membership = await getMembership({ orgId: project.orgId, userId: actorId });
    if (membership && ["OWNER", "ADMIN"].includes(membership.role)) return true;
    const projMember = await getProjectMember(projectId, actorId);
    if (projMember && canManageProject(projMember)) return true;
    return false;
  };

  if (!(await canManage())) {
    throw new AppError("Insufficient permissions - OWNER, ADMIN, or PROJECT LEAD required", 403);
  }

  const existingMember = await getProjectMember(projectId, userId);
  if (!existingMember) {
    throw new AppError("Project member not found", 404);
  }

  await removeProjectMember(projectId, userId);

  recordEventSafely({
    organizationId: project.orgId,
    userId: actorId,
    projectId,
    eventType: "MEMBER_REMOVED",
    entityType: "ProjectMember",
    entityId: userId,
    metadata: {
      memberId: userId,
      memberName: existingMember.user?.name ?? null,
    },
  });

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
