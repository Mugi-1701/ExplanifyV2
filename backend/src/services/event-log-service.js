const { prisma } = require("../lib/prisma");

const recordEvent = async ({
  organizationId,
  projectId,
  userId,
  entityType,
  entityId,
  eventType,
  metadata,
}) => {
  return prisma.eventLog.create({
    data: {
      organizationId,
      projectId: projectId ?? null,
      userId: userId ?? null,
      entityType,
      entityId,
      eventType,
      metadata: metadata ?? {},
    },
  });
};

module.exports = { recordEvent };
