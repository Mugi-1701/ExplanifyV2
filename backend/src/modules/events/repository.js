const { prisma } = require("../../lib/prisma");

const createEvent = async (data) =>
  prisma.eventLog.create({
    data: {
      organizationId: data.organizationId,
      projectId: data.projectId ?? null,
      userId: data.userId ?? null,
      eventType: data.eventType,
      entityType: data.entityType,
      entityId: data.entityId,
      metadata: data.metadata ?? {},
    },
  });

const listProjectEvents = async (projectId) =>
  prisma.eventLog.findMany({
    where: {
      projectId,
    },
    orderBy: { createdAt: "desc" },
  });

module.exports = {
  createEvent,
  listProjectEvents,
};
