const { listAIExplanations } = require("./repository");

const getAIExplanations = async () => listAIExplanations();

module.exports = { getAIExplanations };
