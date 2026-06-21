const { listTeams } = require("./repository");

const getTeams = async ({ orgId }) => {
  if (!orgId) throw new Error("orgId is required");
  return listTeams({ orgId });
};

module.exports = { getTeams };
