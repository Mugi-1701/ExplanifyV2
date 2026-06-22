const { AppError } = require("../../utils/AppError");
const { assertWorkspaceId } = require("./catalog.helpers");
const {
  listRoles,
  createRole,
  updateRole,
  deleteRole,
  getRoleById,
  findRoleByName,
  countRoleUsage,
} = require("./roles.repository");

async function listRolesService(req) {
  const workspaceId = assertWorkspaceId(req);
  return listRoles(workspaceId);
}

async function createRoleService(req, data) {
  const workspaceId = assertWorkspaceId(req);
  const existing = await findRoleByName(workspaceId, data.name);
  if (existing) {
    throw new AppError("Role name already exists in this workspace", 409);
  }
  return createRole({
    workspaceId,
    name: data.name,
    permissions: data.permissions ?? {},
  });
}

async function updateRoleService(req, roleId, data) {
  const workspaceId = assertWorkspaceId(req);
  const existing = await getRoleById(roleId);
  if (!existing || existing.workspaceId !== workspaceId) {
    throw new AppError("Role not found", 404);
  }
  if (typeof data.name === "string") {
    const duplicate = await findRoleByName(workspaceId, data.name);
    if (duplicate && duplicate.id !== roleId) {
      throw new AppError("Role name already exists in this workspace", 409);
    }
  }
  return updateRole(roleId, data);
}

async function deleteRoleService(req, roleId) {
  const workspaceId = assertWorkspaceId(req);
  const existing = await getRoleById(roleId);
  if (!existing || existing.workspaceId !== workspaceId) {
    throw new AppError("Role not found", 404);
  }
  const usage = await countRoleUsage(roleId);
  if (usage > 0) {
    throw new AppError(`This role is currently assigned to ${usage} member${usage === 1 ? "" : "s"}`, 409);
  }
  return deleteRole(roleId);
}

module.exports = { listRolesService, createRoleService, updateRoleService, deleteRoleService };
