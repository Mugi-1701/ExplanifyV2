const { listUsers } = require("./repository");

const getUsers = async () => listUsers();

module.exports = { getUsers };
