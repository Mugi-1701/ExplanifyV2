const express = require("express");
const { authenticate } = require("../auth/auth.middleware");
const { validate } = require("../../middleware/validate");
const { recommendAssigneeSchema, rebalanceSuggestionsSchema } = require("./ai.validation");
const { recommendAssigneeHandler, getProjectWorkloadHandler, getRebalanceSuggestions } = require("./ai.controller");

const router = express.Router();

router.use(authenticate());

router.post("/recommend-assignee", validate(recommendAssigneeSchema), recommendAssigneeHandler);
router.get("/workload", getProjectWorkloadHandler);
router.get("/rebalance", validate(rebalanceSuggestionsSchema, "params"), getRebalanceSuggestions);

module.exports = router;
