const { listTasks } = require("./repository");

const getTasks = async () => listTasks();

module.exports = { getTasks };
