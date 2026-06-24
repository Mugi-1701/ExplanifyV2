const { prisma } = require("../../lib/prisma");

const SUPPORTED_EVENT_TYPES = [
  "TASK_ASSIGNED",
  "TASK_COMPLETED",
  "MEMBER_ADDED",
  "ROLE_CHANGED",
  "PROJECT_CREATED",
];

const LIMIT = 5;
const NOTIFICATION_TYPE = "EVENT_LOG";

function buildNotificationTitle(eventType) {
  switch (eventType) {
    case "TASK_ASSIGNED":
      return "Task assigned";
    case "TASK_COMPLETED":
      return "Task completed";
    case "MEMBER_ADDED":
      return "Member added";
    case "ROLE_CHANGED":
      return "Role changed";
    case "PROJECT_CREATED":
      return "Project created";
    default:
      return "Activity update";
  }
}

function getText(metadata, keys, fallback = null) {
  for (const key of keys) {
    const value = metadata?.[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return fallback;
}

function buildNotificationBody(event) {
  const metadata = event.metadata ?? {};

  switch (event.eventType) {
    case "TASK_ASSIGNED": {
      const taskTitle = getText(metadata, ["taskTitle", "title", "name"], "Task");
      const assignee = getText(metadata, ["memberName", "userName", "assigneeName", "name"], null);
      return assignee ? `${taskTitle} assigned to ${assignee}` : `${taskTitle} assigned`;
    }
    case "TASK_COMPLETED": {
      const taskTitle = getText(metadata, ["taskTitle", "title", "name"], "Task");
      return `${taskTitle} completed`;
    }
    case "MEMBER_ADDED": {
      const memberName = getText(metadata, ["memberName", "userName", "name"], "Member");
      return `${memberName} added to the workspace`;
    }
    case "ROLE_CHANGED": {
      const memberName = getText(metadata, ["memberName", "userName", "name"], "Member");
      const role = getText(metadata, ["role"], null);
      return role ? `${memberName} role changed to ${formatRole(role)}` : `${memberName} role changed`;
    }
    case "PROJECT_CREATED": {
      const projectName = getText(metadata, ["projectName", "name"], "Project");
      return `Created project ${projectName}`;
    }
    default:
      return "Activity recorded";
  }
}

function buildNotificationIcon(eventType) {
  switch (eventType) {
    case "TASK_ASSIGNED":
      return "assignment";
    case "TASK_COMPLETED":
      return "complete";
    case "MEMBER_ADDED":
      return "member";
    case "ROLE_CHANGED":
      return "role";
    case "PROJECT_CREATED":
      return "project";
    default:
      return "activity";
  }
}

function formatRole(value) {
  return String(value)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function getEventNotifications({ organizationId, userId }) {
  const startedAt = Date.now();
  const events = await prisma.eventLog.findMany({
    where: {
      organizationId,
      eventType: { in: SUPPORTED_EVENT_TYPES },
    },
    orderBy: { createdAt: "desc" },
    take: LIMIT,
    include: {
      user: {
        select: { id: true, name: true },
      },
    },
  });

  const readMarkers = await prisma.notification.findMany({
    where: {
      orgId: organizationId,
      userId,
      type: NOTIFICATION_TYPE,
      readAt: {
        not: null,
      },
      eventLogId: {
        in: events.map((event) => event.id),
      },
    },
    select: {
      eventLogId: true,
    },
  });
  const readEventIds = new Set(readMarkers.map((marker) => marker.eventLogId).filter(Boolean));
  const queryExecutionTime = Date.now() - startedAt;

  // eslint-disable-next-line no-console
  console.log("[notifications] list", {
    totalEvents: events.length,
    totalNotifications: readMarkers.length,
    unreadCount: events.length - readMarkers.length,
    queryExecutionTime,
  });

  return events.map((event) => ({
    id: event.id,
    type: event.eventType,
    title: buildNotificationTitle(event.eventType),
    body: buildNotificationBody(event),
    icon: buildNotificationIcon(event.eventType),
    createdAt: event.createdAt,
    read: readEventIds.has(event.id),
    organizationId: event.organizationId,
    projectId: event.projectId,
    userId: event.userId,
    actorName: event.user?.name ?? null,
  }));
}

async function countUnreadNotifications({ organizationId, userId }) {
  const events = await prisma.eventLog.findMany({
    where: {
      organizationId,
      eventType: { in: SUPPORTED_EVENT_TYPES },
    },
    select: { id: true },
  });

  if (events.length === 0) {
    return 0;
  }

  const readMarkers = await prisma.notification.findMany({
    where: {
      orgId: organizationId,
      userId,
      type: NOTIFICATION_TYPE,
      readAt: {
        not: null,
      },
      eventLogId: {
        in: events.map((event) => event.id),
      },
    },
    select: { eventLogId: true },
  });

  return events.length - readMarkers.length;
}

async function markAllNotificationsRead({ organizationId, userId }) {
  const startedAt = Date.now();
  const events = await prisma.eventLog.findMany({
    where: {
      organizationId,
      eventType: { in: SUPPORTED_EVENT_TYPES },
    },
    select: {
      id: true,
      eventType: true,
      entityType: true,
      entityId: true,
      metadata: true,
      createdAt: true,
    },
  });

  if (events.length === 0) {
    return 0;
  }

  const now = new Date();
  const payloads = events.map((event) => ({
    orgId: organizationId,
    userId,
    type: NOTIFICATION_TYPE,
    eventLogId: event.id,
    payload: {
      eventLogId: event.id,
      eventType: event.eventType,
      entityType: event.entityType,
      entityId: event.entityId,
      metadata: event.metadata,
      createdAt: event.createdAt,
    },
    readAt: now,
  }));

  const existing = await prisma.notification.findMany({
    where: {
      orgId: organizationId,
      userId,
      type: NOTIFICATION_TYPE,
      eventLogId: {
        in: events.map((event) => event.id),
      },
    },
    select: {
      eventLogId: true,
    },
  });

  const existingIds = new Set(existing.map((item) => item.eventLogId).filter(Boolean));
  const createManyData = payloads.filter((item) => !existingIds.has(item.eventLogId));

  if (createManyData.length > 0) {
    await prisma.notification.createMany({
      data: createManyData,
      skipDuplicates: true,
    });
  }

  if (existingIds.size > 0) {
    await prisma.notification.updateMany({
      where: {
        orgId: organizationId,
        userId,
        type: NOTIFICATION_TYPE,
        eventLogId: {
          in: Array.from(existingIds),
        },
      },
      data: {
        readAt: now,
      },
    });
  }

  const unreadCount = await countUnreadNotifications({ organizationId, userId });
  const queryExecutionTime = Date.now() - startedAt;

  // eslint-disable-next-line no-console
  console.log("[notifications] markAllRead", {
    totalEvents: events.length,
    totalNotifications: existingIds.size + createManyData.length,
    unreadCount,
    queryExecutionTime,
  });

  return unreadCount;
}

module.exports = { countUnreadNotifications, getEventNotifications, markAllNotificationsRead, SUPPORTED_EVENT_TYPES };
