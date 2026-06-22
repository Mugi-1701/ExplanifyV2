const { asyncHandler } = require("../../utils/async-handler");
const { listSkillsService, createSkillService, updateSkillService, deleteSkillService } = require("./skills.service");

const list = asyncHandler(async (req, res) => {
  const skills = await listSkillsService(req);
  res.json({ data: skills });
});

const create = asyncHandler(async (req, res) => {
  const skill = await createSkillService(req, req.body);
  res.status(201).json({ data: skill });
});

const update = asyncHandler(async (req, res) => {
  const skill = await updateSkillService(req, req.params.id, req.body);
  res.json({ data: skill });
});

const remove = asyncHandler(async (req, res) => {
  await deleteSkillService(req, req.params.id);
  res.status(204).send();
});

module.exports = { list, create, update, remove };
