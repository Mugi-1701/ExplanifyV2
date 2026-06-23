const { z } = require('zod');

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'BLOCKED', 'IN_REVIEW', 'DONE', 'CANCELED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  requiredSkills: z.array(z.string().trim().min(1).max(120)).optional().default([]),
  estimateHours: z.coerce.number().positive().optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  projectId: z.string().uuid(),
  orgId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  aiRecommendedUserId: z.string().uuid().optional().nullable(),
  aiRecommendationScore: z.coerce.number().optional().nullable(),
  aiRecommendationConfidence: z.enum(["LOW", "MEDIUM", "HIGH"]).optional().nullable(),
  aiRecommendationExplanation: z.array(z.string()).optional().nullable(),
  dependsOnTaskId: z.string().uuid().optional().nullable()
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'BLOCKED', 'IN_REVIEW', 'DONE', 'CANCELED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  requiredSkills: z.array(z.string().trim().min(1).max(120)).optional(),
  estimateHours: z.coerce.number().positive().optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  assigneeId: z.string().uuid().optional().nullable(),
  aiRecommendedUserId: z.string().uuid().optional().nullable(),
  aiRecommendationScore: z.coerce.number().optional().nullable(),
  aiRecommendationConfidence: z.enum(["LOW", "MEDIUM", "HIGH"]).optional().nullable(),
  aiRecommendationExplanation: z.array(z.string()).optional().nullable()
});

const createDependencySchema = z.object({
  taskId: z.string().uuid('Invalid taskId'),
  dependsOnTaskId: z.string().uuid('Invalid dependsOnTaskId')
});

const scheduleTaskSchema = z.object({
  date: z.coerce.date(),
  startTime: z.string().trim().min(1),
  durationMinutes: z.coerce.number().int().positive().max(24 * 60),
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().max(5000).optional().nullable(),
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  createDependencySchema,
  scheduleTaskSchema,
};
