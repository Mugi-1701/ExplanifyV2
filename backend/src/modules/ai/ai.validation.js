const { z } = require("zod");

const recommendAssigneeParamsSchema = z.object({
  projectId: z.string().uuid(),
});

const kanbanInsightsParamsSchema = z.object({
  projectId: z.string().uuid(),
});

const recommendAssigneeBodySchema = z.object({
  requiredSkills: z.array(z.string().trim().min(1).max(120)).optional().default([]),
});

const rebalanceSuggestionsSchema = z.object({
  projectId: z.string().uuid(),
});

module.exports = {
  recommendAssigneeParamsSchema,
  recommendAssigneeBodySchema,
  rebalanceSuggestionsSchema,
  kanbanInsightsParamsSchema,
};
