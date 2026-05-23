const { asyncHandler } = require("../../utils/async-handler");
const { getTasks } = require("./service");

const list = asyncHandler(async (req, res) => {
  const tasks = await getTasks();
  res.json({ data: tasks });
});

module.exports = { list };
