const express = require("express");
const { authenticate } = require("../auth/auth.middleware");
const { list } = require("./controller");

const router = express.Router();

router.get("/", authenticate(), list);

module.exports = router;
