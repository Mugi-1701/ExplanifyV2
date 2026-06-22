const { prisma } = require("../../lib/prisma");

const listSkills = (workspaceId) =>
  prisma.workspaceSkill.findMany({
    where: { workspaceId },
    orderBy: [{ createdAt: "asc" }],
  });

const findSkillByName = (workspaceId, name) =>
  prisma.workspaceSkill.findFirst({
    where: {
      workspaceId,
      name: { equals: name, mode: "insensitive" },
    },
  });

const countSkillUsage = (skillId) =>
  prisma.memberSkill.count({
    where: { skillId },
  });

const createSkill = (data) =>
  prisma.workspaceSkill.create({
    data,
  });

const updateSkill = (id, data) =>
  prisma.workspaceSkill.update({
    where: { id },
    data,
  });

const deleteSkill = (id) =>
  prisma.workspaceSkill.delete({
    where: { id },
  });

const getSkillById = (id) =>
  prisma.workspaceSkill.findUnique({
    where: { id },
  });

module.exports = { listSkills, createSkill, updateSkill, deleteSkill, getSkillById, findSkillByName, countSkillUsage };
