const { asyncHandler } = require("../../utils/async-handler");
const {
  createOrg,
  listMyOrgs,
  getOrg,
  updateOrg,
  deleteOrg,
  inviteMember,
  addMemberToOrg,
  removeMemberFromOrg,
  listOrgMembers,
} = require("./organization.service");

const create = asyncHandler(async (req, res) => {
  const organization = await createOrg({
    userId: req.auth.userId,
    name: req.body.name,
  });
  res.status(201).json({ data: organization });
});

const listMine = asyncHandler(async (req, res) => {
  const organizations = await listMyOrgs({ userId: req.auth.userId });
  res.status(200).json({ data: organizations });
});

const getById = asyncHandler(async (req, res) => {
  const organization = await getOrg({
    orgId: req.params.id,
    userId: req.auth.userId,
  });
  res.status(200).json({ data: organization });
});

const update = asyncHandler(async (req, res) => {
  const organization = await updateOrg({
    orgId: req.params.id,
    userId: req.auth.userId,
    name: req.body.name,
  });
  res.status(200).json({ data: organization });
});

const remove = asyncHandler(async (req, res) => {
  await deleteOrg({ orgId: req.params.id, userId: req.auth.userId });
  res.status(204).send();
});

const invite = asyncHandler(async (req, res) => {
  const result = await inviteMember({
    orgId: req.params.id,
    userId: req.auth.userId,
    email: req.body.email,
    role: req.body.role,
    expiresInDays: req.body.expiresInDays,
  });
  res.status(201).json({ data: result.invite, token: result.token });
});

const addMember = asyncHandler(async (req, res) => {
  const membership = await addMemberToOrg({
    orgId: req.params.id,
    userId: req.body.userId,
    role: req.body.role,
  });
  res.status(201).json({ data: membership });
});

const removeMember = asyncHandler(async (req, res) => {
  await removeMemberFromOrg({
    orgId: req.params.id,
    userId: req.auth.userId,
    memberId: req.params.memberId,
  });
  res.status(204).send();
});

const listMembers = asyncHandler(async (req, res) => {
  const members = await listOrgMembers({
    orgId: req.params.id,
    userId: req.auth.userId,
  });
  res.status(200).json({ data: members });
});

module.exports = {
  create,
  listMine,
  getById,
  update,
  remove,
  invite,
  addMember,
  removeMember,
  listMembers,
};
