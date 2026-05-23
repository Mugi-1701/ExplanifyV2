const { eventBus } = require("../events/bus");
const { eventTypes } = require("../events/event-types");

const emitRiskUpdate = (riskPayload) => {
  eventBus.emit(eventTypes.RISK_SCORE_UPDATED, riskPayload);
};

module.exports = { emitRiskUpdate };
