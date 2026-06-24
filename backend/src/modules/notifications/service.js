const { countUnreadNotifications, getEventNotifications, markAllNotificationsRead } = require("./repository");

const getNotifications = async ({ organizationId, userId }) => {
  const [notifications, unreadCount] = await Promise.all([
    getEventNotifications({ organizationId, userId }),
    countUnreadNotifications({ organizationId, userId }),
  ]);

  return { notifications, unreadCount };
};

const markAllRead = async ({ organizationId, userId }) => {
  await markAllNotificationsRead({ organizationId, userId });
  return countUnreadNotifications({ organizationId, userId });
};

module.exports = { getNotifications, markAllRead };
