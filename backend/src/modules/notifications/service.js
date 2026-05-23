const { listNotifications } = require("./repository");

const getNotifications = async () => listNotifications();

module.exports = { getNotifications };
