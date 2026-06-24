const express = require("express");
const { authenticate } = require("../auth/auth.middleware");
const { requireOrgMembership, requireOrgRole } = require("../organizations/organization.middleware");
const { requirePermission } = require("../../middleware/require-permission");
const { validate } = require("../../middleware/validate");
const { createProjectSchema, updateProjectSchema, listProjectsSchema, addProjectMemberSchema, updateProjectMemberSchema } = require("./project.validation");
const { attachOrgIdFromBody, loadProject, requireOrgMembershipIfQuery, requireOrgRoleOrProjectLead } = require("./project.middleware");
const { create, list, getById, update, remove, listMembers, addMember, updateMember, removeMember } = require("./project.controller");

const router = express.Router();

// POST /api/projects — create a new project
router.post(
	"/",
	authenticate(),
	validate(createProjectSchema),
	attachOrgIdFromBody(),
	requireOrgMembership(),
	requirePermission("CREATE_PROJECT"),
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
	requirePermission("UPDATE_PROJECT"),
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
	requirePermission("DELETE_PROJECT"),
	requireOrgRole(["OWNER", "ADMIN"]),
	remove
);

router.get("/:id/members", authenticate(), loadProject(), requireOrgMembership(), listMembers);

router.post(
	"/:id/members",
	authenticate(),
	loadProject(),
	requireOrgMembership(),
	requirePermission("MANAGE_MEMBERS"),
	requireOrgRoleOrProjectLead(["OWNER", "ADMIN"]),
	validate(addProjectMemberSchema),
	addMember
);

router.patch(
	"/:id/members/:userId",
	authenticate(),
	loadProject(),
	requireOrgMembership(),
	requirePermission("MANAGE_MEMBERS"),
	requireOrgRoleOrProjectLead(["OWNER", "ADMIN"]),
	validate(updateProjectMemberSchema),
	updateMember
);

router.delete(
	"/:id/members/:userId",
	authenticate(),
	loadProject(),
	requireOrgMembership(),
	requirePermission("MANAGE_MEMBERS"),
	requireOrgRoleOrProjectLead(["OWNER", "ADMIN"]),
	removeMember
);

module.exports = router;
