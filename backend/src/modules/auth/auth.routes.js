const express = require("express");
const { signupHandler, loginHandler, refreshHandler, meHandler } = require("./auth.controller");
const { authenticate } = require("./auth.middleware");
const { validate } = require("../../middleware/validate");
const { signupSchema, loginSchema, refreshSchema } = require("./auth.validation");

const router = express.Router();

router.post("/signup", validate(signupSchema), signupHandler);
router.post("/login", validate(loginSchema), loginHandler);
router.post("/refresh", validate(refreshSchema), refreshHandler);
router.get("/me", authenticate(), meHandler);

module.exports = router;
