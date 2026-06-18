const { z } = require("zod");

const recommendAssigneeSchema = z.object({
  requiredSkills: z.array(z.enum(["Frontend", "Backend", "AI/ML", "UI/UX", "Testing", "DevOps"])).default([]),
});

module.exports = {
  recommendAssigneeSchema,
};
