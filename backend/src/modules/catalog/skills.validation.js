const { z } = require("zod");

const createSkillSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

const updateSkillSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
});

module.exports = { createSkillSchema, updateSkillSchema };
