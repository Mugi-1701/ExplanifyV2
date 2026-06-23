const express = require("express");
const { authenticate } = require("../auth/auth.middleware");
const { validate } = require("../../middleware/validate");
const {
  createCalendarEventSchema,
  updateCalendarEventSchema,
  listCalendarEventsSchema,
} = require("./calendar.validation");
const controller = require("./calendar.controller");

const router = express.Router();

router.use(authenticate());

router.get("/", validate(listCalendarEventsSchema, "query"), controller.list);
router.post("/", validate(createCalendarEventSchema), controller.create);
router.get("/:id", controller.getById);
router.patch("/:id", validate(updateCalendarEventSchema), controller.update);
router.delete("/:id", controller.remove);

module.exports = router;
