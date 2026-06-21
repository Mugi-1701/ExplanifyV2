const { asyncHandler } = require("../../utils/async-handler");
const { getTeams } = require("./service");

const list = asyncHandler(async (req, res) => {
  const orgId = req.query.orgId || req.auth?.activeOrgId;
  const teams = await getTeams({ orgId });
  res.json({ data: teams });
});

module.exports = { list };
