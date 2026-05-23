const { asyncHandler } = require("../../utils/async-handler");
const { getUsers } = require("./service");

const list = asyncHandler(async (req, res) => {
  const users = await getUsers();
  res.json({ data: users });
});

module.exports = { list };
