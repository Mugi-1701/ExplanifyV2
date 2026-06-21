const { prisma } = require("../../lib/prisma");

const listTeams = async ({ orgId }) => {
  return prisma.team.findMany({
    where: { orgId },
    include: {
      _count: {
        select: { members: true }
      }
    },
    orderBy: { name: "asc" }
  });
};

module.exports = { listTeams };
