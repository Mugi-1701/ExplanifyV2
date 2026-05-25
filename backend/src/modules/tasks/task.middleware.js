const prisma = require("../../config/prisma");

async function loadTask(req, res, next) {
    try {
        const { taskId } = req.params;

        if (!taskId) {
            return res.status(400).json({
                message: "Task ID is required",
            });
        }

        const task = await prisma.task.findUnique({
            where: {
                id: taskId,
            },
        });

        if (!task) {
            return res.status(404).json({
                message: "Task not found",
            });
        }

        req.task = task;

/**
 * Inject org context for membership middleware
 */
req.orgId = task.organizationId || task.orgId || null;

next();
    } catch (error) {
        next(error);
    }
}

module.exports = {
    loadTask,
};