const { eventBus } = require("./bus");
const { eventTypes } = require("./event-types");
const { coordinationHandler } = require("./handlers/coordination-handler");
const { aiExplanationHandler } = require("./handlers/ai-explanation-handler");

const registerEventHandlers = () => {
  eventBus.on(eventTypes.BLOCKER_DETECTED, coordinationHandler);
  eventBus.on(eventTypes.RISK_SCORE_UPDATED, aiExplanationHandler);
};

module.exports = { registerEventHandlers };
