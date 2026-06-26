const { prisma } = require("../../../lib/prisma");

async function getProjectWorkloadData(projectId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          memberSkills: {
            include: {
              skill: true,
            },
          },
        },
      },
      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
          assigneeId: true,
          requiredSkills: true,
        },
      },
      organization: {
        include: {
          skills: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return project;
}

module.exports = { getProjectWorkloadData };
