const { asyncHandler } = require("../../utils/async-handler");
const { getNotifications } = require("./service");

const list = asyncHandler(async (req, res) => {
  const notifications = await getNotifications();
  res.json({ data: notifications });
});

module.exports = { list };
