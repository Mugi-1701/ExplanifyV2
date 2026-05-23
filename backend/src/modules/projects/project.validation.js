const { z } = require("zod");

const ProjectStatusEnum = z.enum(["PLANNING", "ACTIVE", "AT_RISK", "PAUSED", "COMPLETED", "ARCHIVED"]);

const createProjectSchema = z.object({
  orgId: z.string().uuid({ message: "orgId must be a valid UUID" }),
  name: z.string().min(2, "Name must be at least 2 characters").max(150),
  slug: z.string().min(2).max(150).optional(),
  description: z.string().max(2000).optional(),
  status: ProjectStatusEnum.optional(),
  teamId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  slug: z.string().min(2).max(150).optional(),
  description: z.string().max(2000).optional(),
  status: ProjectStatusEnum.optional(),
  teamId: z.string().uuid().optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
});

const listProjectsSchema = z.object({
  orgId: z.string().uuid().optional(),
});

module.exports = { createProjectSchema, updateProjectSchema, listProjectsSchema };
