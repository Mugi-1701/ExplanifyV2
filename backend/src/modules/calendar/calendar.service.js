const { AppError } = require("../../utils/AppError");
const { prisma } = require("../../lib/prisma");
const {
  createCalendarEvent,
  listCalendarEvents,
  getCalendarEventById,
  updateCalendarEvent,
  deleteCalendarEvent,
} = require("./calendar.repository");

async function assertEventOwnership(eventId, userId) {
  const event = await getCalendarEventById(eventId);

  if (!event) {
    throw new AppError("Calendar event not found", 404);
  }

  if (event.userId !== userId) {
    throw new AppError("You can only access your own calendar events", 403);
  }

  return event;
}

async function assertTaskOwnership(taskId, userId) {
  if (!taskId) {
    return null;
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      createdById: true,
      assigneeId: true,
    },
  });

  if (!task) {
    throw new AppError("Linked task not found", 404);
  }

  if (task.createdById !== userId && task.assigneeId !== userId) {
    throw new AppError("You can only link tasks you own or are assigned to", 403);
  }

  return task;
}

async function createEvent({ userId, data }) {
  await assertTaskOwnership(data.taskId, userId);

  // Debug trace to follow UTC handling into the service layer.
  // eslint-disable-next-line no-console
  console.log("[calendar.service] create event", {
    userId,
    title: data.title,
    startTime: data.startTime,
    endTime: data.endTime,
    taskId: data.taskId ?? null,
  });

  return createCalendarEvent({
    userId,
    title: data.title,
    description: data.description ?? null,
    startTime: data.startTime,
    endTime: data.endTime,
    taskId: data.taskId ?? null,
  });
}

async function listEvents({ userId, startTime, endTime }) {
  return listCalendarEvents(userId, { startTime, endTime });
}

async function getEvent({ eventId, userId }) {
  return assertEventOwnership(eventId, userId);
}

async function updateEvent({ eventId, userId, data }) {
  const event = await assertEventOwnership(eventId, userId);
  if (data.taskId !== undefined) {
    await assertTaskOwnership(data.taskId, userId);
  }

  // Debug trace to follow UTC handling into the service layer.
  // eslint-disable-next-line no-console
  console.log("[calendar.service] update event", {
    eventId,
    userId,
    startTime: data.startTime ?? null,
    endTime: data.endTime ?? null,
    taskId: data.taskId ?? null,
  });

  return updateCalendarEvent(event.id, {
    ...(data.title !== undefined ? { title: data.title } : {}),
    ...(data.description !== undefined ? { description: data.description ?? null } : {}),
    ...(data.startTime !== undefined ? { startTime: data.startTime } : {}),
    ...(data.endTime !== undefined ? { endTime: data.endTime } : {}),
    ...(data.taskId !== undefined ? { taskId: data.taskId ?? null } : {}),
  });
}

async function removeEvent({ eventId, userId }) {
  const event = await assertEventOwnership(eventId, userId);
  await deleteCalendarEvent(event.id);
  return { message: "Calendar event deleted successfully" };
}

module.exports = {
  createEvent,
  listEvents,
  getEvent,
  updateEvent,
  removeEvent,
};
