const express = require("express");
const { authenticate } = require("../auth/auth.middleware");
const { requireOrgMembership } = require("../organizations/organization.middleware");
const { validate } = require("../../middleware/validate");
const { createRoleSchema, updateRoleSchema } = require("./roles.validation");
const { list, create, update, remove } = require("./roles.controller");

const router = express.Router();

router.use(
  authenticate(),
  (req, res, next) => {
    req.orgId = req.auth?.activeOrgId ?? null;
    next();
  },
  requireOrgMembership()
);

router.get("/", list);
router.post("/", validate(createRoleSchema), create);
router.patch("/:id", validate(updateRoleSchema), update);
router.delete("/:id", remove);

module.exports = router;
