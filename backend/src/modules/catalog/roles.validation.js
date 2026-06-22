const { z } = require("zod");

const createRoleSchema = z.object({
  name: z.string().trim().min(1).max(120),
  permissions: z.record(z.any()).optional().default({}),
});

const updateRoleSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  permissions: z.record(z.any()).optional(),
});

module.exports = { createRoleSchema, updateRoleSchema };
