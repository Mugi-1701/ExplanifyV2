const { asyncHandler } = require("../../utils/async-handler");
const { getTeams } = require("./service");

const list = asyncHandler(async (req, res) => {
  const teams = await getTeams();
  res.json({ data: teams });
});

module.exports = { list };
