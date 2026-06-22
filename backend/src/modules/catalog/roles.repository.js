const { prisma } = require("../../lib/prisma");

const listRoles = (workspaceId) =>
  prisma.workspaceRole.findMany({
    where: { workspaceId },
    orderBy: [{ createdAt: "asc" }],
  });

const findRoleByName = (workspaceId, name) =>
  prisma.workspaceRole.findFirst({
    where: {
      workspaceId,
      name: { equals: name, mode: "insensitive" },
    },
  });

const countRoleUsage = (roleId) =>
  prisma.projectMember.count({
    where: { roleId },
  });

const createRole = (data) =>
  prisma.workspaceRole.create({
    data,
  });

const updateRole = (id, data) =>
  prisma.workspaceRole.update({
    where: { id },
    data,
  });

const deleteRole = (id) =>
  prisma.workspaceRole.delete({
    where: { id },
  });

const getRoleById = (id) =>
  prisma.workspaceRole.findUnique({
    where: { id },
  });

module.exports = { listRoles, createRole, updateRole, deleteRole, getRoleById, findRoleByName, countRoleUsage };
