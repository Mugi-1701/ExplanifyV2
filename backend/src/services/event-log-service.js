const { prisma } = require("../lib/prisma");

const recordEvent = async ({ orgId, actorId, entityType, entityId, eventType, payload }) => {
  return prisma.eventLog.create({
    data: {
      orgId,
      actorId,
      entityType,
      entityId,
      eventType,
      payload,
    },
  });
};

module.exports = { recordEvent };
