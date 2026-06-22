const { prisma } = require("../../lib/prisma");

const projectInclude = {
  owner: { select: { id: true, name: true, email: true } },
  organization: { select: { id: true, name: true, slug: true } },
  members: {
    include: {
      roleRef: true,
      memberSkills: {
        include: {
          skill: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  },
  tasks: {
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      assigneeId: true,
      dependencies: {
        select: {
          dependsOnTask: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      },
    },
  },
};

/**
 * Create a new project record.
 */
const createProject = async ({ orgId, ownerId, teamId, teamCode, name, slug, description, status, startDate, dueDate }) =>
  prisma.project.create({
    data: {
      orgId,
      ownerId,
      teamId: teamId ?? null,
      teamCode: teamCode ?? null,
      name,
      slug: slug ?? null,
      description: description ?? null,
      status: status ?? "ACTIVE",
      startDate: startDate ?? null,
      dueDate: dueDate ?? null,
    },
    include: projectInclude,
  });

/**
 * Find a project by its ID.
 */
const findProjectById = async (id) =>
  prisma.project.findUnique({
    where: { id },
    include: projectInclude,
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
    include: projectInclude,
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
    include: projectInclude,
  });

const listProjectMembers = async (projectId) =>
  prisma.projectMember.findMany({
    where: { projectId },
    include: {
      roleRef: true,
      memberSkills: {
        include: {
          skill: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

const getProjectMember = async (projectId, userId) =>
  prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

const addProjectMember = async ({ projectId, userId, roleId = null, role = "Member", skills = [], skillIds = [] }) =>
  prisma.projectMember.create({
    data: {
      projectId,
      userId,
      roleId,
      role,
      skills,
      memberSkills: skillIds.length
        ? {
            createMany: {
              data: skillIds.map((skillId) => ({ skillId })),
              skipDuplicates: true,
            },
          }
        : undefined,
    },
    include: {
      roleRef: true,
      memberSkills: {
        include: {
          skill: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

const updateProjectMember = async (projectId, userId, data) =>
  prisma.$transaction(async (tx) => {
    const member = await tx.projectMember.update({
      where: {
        projectId_userId: { projectId, userId },
      },
      data: {
        roleId: data.roleId,
        role: data.role,
        skills: data.skills,
      },
      include: {
        roleRef: true,
        memberSkills: {
          include: {
            skill: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (Array.isArray(data.skillIds)) {
      await tx.memberSkill.deleteMany({ where: { memberId: member.id } });
      if (data.skillIds.length > 0) {
        await tx.memberSkill.createMany({
          data: data.skillIds.map((skillId) => ({ memberId: member.id, skillId })),
          skipDuplicates: true,
        });
      }
    }

    return tx.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      include: {
        roleRef: true,
        memberSkills: {
          include: {
            skill: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  });

const removeProjectMember = async (projectId, userId) =>
  prisma.projectMember.delete({
    where: {
      projectId_userId: { projectId, userId },
    },
  });

const getProjectTaskCountsByAssignee = async (projectId) => {
  const tasks = await prisma.task.findMany({
    where: { projectId },
    select: { assigneeId: true, status: true },
  });

  const counts = new Map();
  for (const task of tasks) {
    if (!task.assigneeId) continue;
    const current = counts.get(task.assigneeId) ?? { assignedTaskCount: 0, activeTaskCount: 0, completedTaskCount: 0 };
    current.assignedTaskCount += 1;
    if (task.status === "DONE") current.completedTaskCount += 1;
    if (task.status === "IN_PROGRESS") current.activeTaskCount += 1;
    counts.set(task.assigneeId, current);
  }

  return counts;
};

/**
 * Delete a project by ID.
 */
const deleteProject = async (id) =>
  prisma.$transaction(async (tx) => {
    const taskIds = (
      await tx.task.findMany({
        where: { projectId: id },
        select: { id: true },
      })
    ).map((task) => task.id);

    if (taskIds.length > 0) {
      await tx.taskDependency.deleteMany({
        where: {
          OR: [{ taskId: { in: taskIds } }, { dependsOnTaskId: { in: taskIds } }],
        },
      });
    }

    await tx.projectActivity.deleteMany({ where: { projectId: id } });
    await tx.projectMember.deleteMany({ where: { projectId: id } });
    await tx.task.deleteMany({ where: { projectId: id } });

    return tx.project.delete({ where: { id } });
  });

module.exports = {
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
};
