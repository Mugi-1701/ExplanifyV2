const express = require("express");
const {
  create,
  listMine,
  getById,
  update,
  remove,
  invite,
  addMember,
  removeMember,
  listMembers,
} = require("./organization.controller");
const { authenticate } = require("../auth/auth.middleware");
const { validate } = require("../../middleware/validate");
const {
  createOrgSchema,
  updateOrgSchema,
  inviteSchema,
  addMemberSchema,
} = require("./organization.validation");
const { requireOrgMembership, requireOrgRole } = require("./organization.middleware");

const router = express.Router();

router.post("/", authenticate(), validate(createOrgSchema), create);
router.get("/", authenticate(), listMine);
router.get("/:id", authenticate(), requireOrgMembership(), getById);
router.patch(
  "/:id",
  authenticate(),
  requireOrgMembership(),
  requireOrgRole(["OWNER", "ADMIN"]),
  validate(updateOrgSchema),
  update
);
router.delete(
  "/:id",
  authenticate(),
  requireOrgMembership(),
  requireOrgRole(["OWNER"]),
  remove
);

router.get(
  "/:id/members",
  authenticate(),
  requireOrgMembership(),
  listMembers
);
router.post(
  "/:id/invite",
  authenticate(),
  requireOrgMembership(),
  requireOrgRole(["OWNER", "ADMIN"]),
  validate(inviteSchema),
  invite
);
router.post(
  "/:id/members",
  authenticate(),
  requireOrgMembership(),
  requireOrgRole(["OWNER", "ADMIN"]),
  validate(addMemberSchema),
  addMember
);
router.delete(
  "/:id/members/:memberId",
  authenticate(),
  requireOrgMembership(),
  requireOrgRole(["OWNER", "ADMIN"]),
  removeMember
);

module.exports = router;
