const { z } = require("zod");

const createOrgSchema = z.object({
  name: z.string().min(2).max(120),
});

const updateOrgSchema = z.object({
  name: z.string().min(2).max(120),
});

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]).optional(),
  expiresInDays: z.number().int().min(1).max(30).optional(),
});

const addMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]).optional(),
});

module.exports = {
  createOrgSchema,
  updateOrgSchema,
  inviteSchema,
  addMemberSchema,
};
