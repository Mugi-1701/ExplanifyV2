const express = require("express");
const { authenticate } = require("../auth/auth.middleware");
const { requireOrgMembership, requireOrgRole } = require("../organizations/organization.middleware");
const { validate } = require("../../middleware/validate");
const { createProjectSchema, updateProjectSchema, listProjectsSchema, addProjectMemberSchema, updateProjectMemberSchema } = require("./project.validation");
const { attachOrgIdFromBody, loadProject, requireOrgMembershipIfQuery } = require("./project.middleware");
const { create, list, getById, update, remove, listMembers, addMember, updateMember, removeMember } = require("./project.controller");

const router = express.Router();

// POST /api/projects — create a new project
router.post(
	"/",
	authenticate(),
	validate(createProjectSchema),
	attachOrgIdFromBody(),
	requireOrgMembership(),
	create
);

// GET /api/projects — list all projects user has access to (?orgId= optional)
router.get(
	"/",
	authenticate(),
	validate(listProjectsSchema, "query"),
	requireOrgMembershipIfQuery(),
	list
);

// GET /api/projects/:id — get a single project
router.get("/:id", authenticate(), loadProject(), requireOrgMembership(), getById);

// PATCH /api/projects/:id — update a project (OWNER/ADMIN only)
router.patch(
	"/:id",
	authenticate(),
	loadProject(),
	requireOrgMembership(),
	requireOrgRole(["OWNER", "ADMIN"]),
	validate(updateProjectSchema),
	update
);

// DELETE /api/projects/:id — delete a project (OWNER/ADMIN only)
router.delete(
	"/:id",
	authenticate(),
	loadProject(),
	requireOrgMembership(),
	requireOrgRole(["OWNER", "ADMIN"]),
	remove
);

router.get("/:id/members", authenticate(), loadProject(), requireOrgMembership(), listMembers);

router.post(
	"/:id/members",
	authenticate(),
	loadProject(),
	requireOrgMembership(),
	requireOrgRole(["OWNER", "ADMIN"]),
	validate(addProjectMemberSchema),
	addMember
);

router.patch(
	"/:id/members/:userId",
	authenticate(),
	loadProject(),
	requireOrgMembership(),
	requireOrgRole(["OWNER", "ADMIN"]),
	validate(updateProjectMemberSchema),
	updateMember
);

router.delete(
	"/:id/members/:userId",
	authenticate(),
	loadProject(),
	requireOrgMembership(),
	requireOrgRole(["OWNER", "ADMIN"]),
	removeMember
);

module.exports = router;
