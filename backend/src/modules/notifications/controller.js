const { asyncHandler } = require("../../utils/async-handler");
const { authenticate } = require("../auth/auth.middleware");
const { getNotifications, markAllRead } = require("./service");
const { AppError } = require("../../utils/AppError");

const list = [
  authenticate(),
  asyncHandler(async (req, res) => {
    if (!req.auth?.activeOrgId) {
      throw new AppError("Missing active organization", 403);
    }

    const result = await getNotifications({
      organizationId: req.auth.activeOrgId,
      userId: req.auth.userId,
    });
    res.json({ data: result.notifications, unreadCount: result.unreadCount });
  }),
];

const read = [
  authenticate(),
  asyncHandler(async (req, res) => {
    if (!req.auth?.activeOrgId) {
      throw new AppError("Missing active organization", 403);
    }

    const unreadCount = await markAllRead({
      organizationId: req.auth.activeOrgId,
      userId: req.auth.userId,
    });

    res.json({ data: { unreadCount } });
  }),
];

module.exports = { list, read };
