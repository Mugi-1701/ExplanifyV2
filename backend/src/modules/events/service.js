const { createEvent, listProjectEvents } = require("./repository");

const logEvent = async (data) => createEvent(data);
const recordEvent = async (data) => logEvent(data);

const recordEventSafely = async (data) => {
  try {
    const result = await recordEvent(data);
    return result;
  } catch (error) {
    console.error("[event-service] failed to record event", {
      error: error?.message,
      eventType: data?.eventType,
      entityType: data?.entityType,
      entityId: data?.entityId,
      organizationId: data?.organizationId,
      projectId: data?.projectId,
      userId: data?.userId,
    });
    return null;
  }
};

const getProjectEventHistory = async ({ projectId }) => listProjectEvents(projectId);

module.exports = {
  logEvent,
  recordEvent,
  recordEventSafely,
  getProjectEventHistory,
};
