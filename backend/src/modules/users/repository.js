const { prisma } = require("../../lib/prisma");

const listUsers = async () =>
  prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
    },
    orderBy: { name: "asc" },
  });

module.exports = { listUsers };
