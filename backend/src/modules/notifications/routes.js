const express = require("express");
const { list, read } = require("./controller");

const router = express.Router();

router.get("/", ...list);
router.patch("/read", ...read);

module.exports = router;
