const express = require("express");
const { authenticate } = require("../auth/auth.middleware");
const { listProjectEvents } = require("./controller");

const router = express.Router();

router.get("/project/:projectId", authenticate(), listProjectEvents);

module.exports = router;
