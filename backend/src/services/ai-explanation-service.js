const { prisma } = require("../lib/prisma");

const saveExplanation = async ({ orgId, entityType, entityId, eventId, summary, rationale, evidence, confidence }) => {
  return prisma.aIExplanation.create({
    data: {
      orgId,
      entityType,
      entityId,
      eventId,
      summary,
      rationale,
      evidence,
      confidence,
    },
  });
};

module.exports = { saveExplanation };
