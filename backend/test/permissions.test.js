const test = require("node:test");
const assert = require("node:assert/strict");

const { PERMISSIONS, hasPermission } = require("../src/lib/permissions");

test("OWNER has full access", () => {
  for (const permission of Object.values(PERMISSIONS)) {
    assert.equal(hasPermission("OWNER", permission), true);
  }
});

test("ADMIN can do everything except delete permissions", () => {
  assert.equal(hasPermission("ADMIN", PERMISSIONS.CREATE_PROJECT), true);
  assert.equal(hasPermission("ADMIN", PERMISSIONS.UPDATE_PROJECT), true);
  assert.equal(hasPermission("ADMIN", PERMISSIONS.MANAGE_MEMBERS), true);
  assert.equal(hasPermission("ADMIN", PERMISSIONS.CREATE_TASK), true);
  assert.equal(hasPermission("ADMIN", PERMISSIONS.UPDATE_TASK), true);
  assert.equal(hasPermission("ADMIN", PERMISSIONS.ASSIGN_TASK), true);
  assert.equal(hasPermission("ADMIN", PERMISSIONS.VIEW_PROJECT), true);
  assert.equal(hasPermission("ADMIN", PERMISSIONS.VIEW_DASHBOARD), true);
  assert.equal(hasPermission("ADMIN", PERMISSIONS.VIEW_ACTIVITY), true);
  assert.equal(hasPermission("ADMIN", PERMISSIONS.DELETE_PROJECT), false);
  assert.equal(hasPermission("ADMIN", PERMISSIONS.DELETE_ORGANIZATION), false);
});

test("MEMBER has workspace visibility and task collaboration only", () => {
  assert.equal(hasPermission("MEMBER", PERMISSIONS.VIEW_PROJECT), true);
  assert.equal(hasPermission("MEMBER", PERMISSIONS.VIEW_DASHBOARD), true);
  assert.equal(hasPermission("MEMBER", PERMISSIONS.VIEW_ACTIVITY), true);
  assert.equal(hasPermission("MEMBER", PERMISSIONS.CREATE_TASK), true);
  assert.equal(hasPermission("MEMBER", PERMISSIONS.UPDATE_TASK), true);
  assert.equal(hasPermission("MEMBER", PERMISSIONS.ASSIGN_TASK), true);
  assert.equal(hasPermission("MEMBER", PERMISSIONS.CREATE_PROJECT), false);
  assert.equal(hasPermission("MEMBER", PERMISSIONS.MANAGE_MEMBERS), false);
  assert.equal(hasPermission("MEMBER", PERMISSIONS.DELETE_TASK), false);
});

test("VIEWER is read-only", () => {
  assert.equal(hasPermission("VIEWER", PERMISSIONS.VIEW_PROJECT), true);
  assert.equal(hasPermission("VIEWER", PERMISSIONS.VIEW_DASHBOARD), true);
  assert.equal(hasPermission("VIEWER", PERMISSIONS.VIEW_ACTIVITY), true);
  assert.equal(hasPermission("VIEWER", PERMISSIONS.CREATE_TASK), false);
  assert.equal(hasPermission("VIEWER", PERMISSIONS.UPDATE_TASK), false);
  assert.equal(hasPermission("VIEWER", PERMISSIONS.ASSIGN_TASK), false);
  assert.equal(hasPermission("VIEWER", PERMISSIONS.CREATE_PROJECT), false);
  assert.equal(hasPermission("VIEWER", PERMISSIONS.MANAGE_MEMBERS), false);
  assert.equal(hasPermission("VIEWER", PERMISSIONS.DELETE_PROJECT), false);
});
