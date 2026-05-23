const { listTeams } = require("./repository");

const getTeams = async () => listTeams();

module.exports = { getTeams };
