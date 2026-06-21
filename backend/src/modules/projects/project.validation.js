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
  category: z.string().optional(),
  priority: z.string().optional(),
  goal: z.string().optional(),
  expectedDeliverable: z.string().optional(),
  estimatedDuration: z.string().optional(),
  leadId: z.string().uuid().optional(),
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

const projectMemberRoleEnum = z.enum(["OWNER", "LEAD", "MEMBER"]);
const projectSkillEnum = z.enum(["Frontend", "Backend", "AI/ML", "UI/UX", "Testing", "DevOps"]);

const addProjectMemberSchema = z.object({
  userId: z.string().uuid(),
  role: projectMemberRoleEnum.optional(),
  skills: z.array(projectSkillEnum).optional(),
});

const updateProjectMemberSchema = z
  .object({
    role: projectMemberRoleEnum.optional(),
    skills: z.array(projectSkillEnum).optional(),
  })
  .refine((value) => value.role !== undefined || value.skills !== undefined, {
    message: "At least one field is required",
  });

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  listProjectsSchema,
  addProjectMemberSchema,
  updateProjectMemberSchema,
  projectMemberRoleEnum,
  projectSkillEnum,
};
