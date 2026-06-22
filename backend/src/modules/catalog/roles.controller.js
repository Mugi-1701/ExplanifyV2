const { asyncHandler } = require("../../utils/async-handler");
const { listRolesService, createRoleService, updateRoleService, deleteRoleService } = require("./roles.service");

const list = asyncHandler(async (req, res) => {
  const roles = await listRolesService(req);
  res.json({ data: roles });
});

const create = asyncHandler(async (req, res) => {
  const role = await createRoleService(req, req.body);
  res.status(201).json({ data: role });
});

const update = asyncHandler(async (req, res) => {
  const role = await updateRoleService(req, req.params.id, req.body);
  res.json({ data: role });
});

const remove = asyncHandler(async (req, res) => {
  await deleteRoleService(req, req.params.id);
  res.status(204).send();
});

module.exports = { list, create, update, remove };
