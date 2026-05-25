const { z } = require('zod');

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'BLOCKED', 'IN_REVIEW', 'DONE', 'CANCELED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  estimateHours: z.number().positive().optional(),
  startDate: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  projectId: z.string().uuid(),
  orgId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional().nullable()
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'BLOCKED', 'IN_REVIEW', 'DONE', 'CANCELED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  estimateHours: z.number().positive().optional(),
  startDate: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  assigneeId: z.string().uuid().optional().nullable()
});

const createDependencySchema = z.object({
  taskId: z.string().uuid('Invalid taskId'),
  dependsOnTaskId: z.string().uuid('Invalid dependsOnTaskId')
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  createDependencySchema
};
