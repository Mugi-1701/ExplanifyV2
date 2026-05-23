const express = require("express");
const { list } = require("./controller");

const router = express.Router();

router.get("/", list);

module.exports = router;
