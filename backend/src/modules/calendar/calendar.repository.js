const { prisma } = require("../../lib/prisma");

function buildEventInclude() {
  return {
    task: {
      select: {
        id: true,
        title: true,
        status: true,
        projectId: true,
        assigneeId: true,
        createdById: true,
      },
    },
  };
}

async function createCalendarEvent(data) {
  return prisma.calendarEvent.create({
    data,
    include: buildEventInclude(),
  });
}

async function listCalendarEvents(userId, { startTime, endTime } = {}) {
  return prisma.calendarEvent.findMany({
    where: {
      userId,
      ...(startTime || endTime
        ? {
            startTime: startTime || undefined,
            endTime: endTime || undefined,
          }
        : {}),
    },
    orderBy: { startTime: "asc" },
    include: buildEventInclude(),
  });
}

async function getCalendarEventById(id) {
  return prisma.calendarEvent.findUnique({
    where: { id },
    include: buildEventInclude(),
  });
}

async function updateCalendarEvent(id, data) {
  return prisma.calendarEvent.update({
    where: { id },
    data,
    include: buildEventInclude(),
  });
}

async function deleteCalendarEvent(id) {
  return prisma.calendarEvent.delete({
    where: { id },
  });
}

module.exports = {
  createCalendarEvent,
  listCalendarEvents,
  getCalendarEventById,
  updateCalendarEvent,
  deleteCalendarEvent,
};
