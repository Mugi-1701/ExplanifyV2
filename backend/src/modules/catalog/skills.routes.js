const express = require("express");
const { authenticate } = require("../auth/auth.middleware");
const { requireOrgMembership } = require("../organizations/organization.middleware");
const { validate } = require("../../middleware/validate");
const { createSkillSchema, updateSkillSchema } = require("./skills.validation");
const { list, create, update, remove } = require("./skills.controller");

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
router.post("/", validate(createSkillSchema), create);
router.patch("/:id", validate(updateSkillSchema), update);
router.delete("/:id", remove);

module.exports = router;
