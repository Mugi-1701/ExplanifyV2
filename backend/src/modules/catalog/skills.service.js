const { AppError } = require("../../utils/AppError");
const { assertWorkspaceId } = require("./catalog.helpers");
const {
  listSkills,
  createSkill,
  updateSkill,
  deleteSkill,
  getSkillById,
  findSkillByName,
  countSkillUsage,
} = require("./skills.repository");

async function listSkillsService(req) {
  const workspaceId = assertWorkspaceId(req);
  return listSkills(workspaceId);
}

async function createSkillService(req, data) {
  const workspaceId = assertWorkspaceId(req);
  const existing = await findSkillByName(workspaceId, data.name);
  if (existing) {
    throw new AppError("Skill name already exists in this workspace", 409);
  }
  return createSkill({
    workspaceId,
    name: data.name,
  });
}

async function updateSkillService(req, skillId, data) {
  const workspaceId = assertWorkspaceId(req);
  const existing = await getSkillById(skillId);
  if (!existing || existing.workspaceId !== workspaceId) {
    throw new AppError("Skill not found", 404);
  }
  if (typeof data.name === "string") {
    const duplicate = await findSkillByName(workspaceId, data.name);
    if (duplicate && duplicate.id !== skillId) {
      throw new AppError("Skill name already exists in this workspace", 409);
    }
  }
  return updateSkill(skillId, data);
}

async function deleteSkillService(req, skillId) {
  const workspaceId = assertWorkspaceId(req);
  const existing = await getSkillById(skillId);
  if (!existing || existing.workspaceId !== workspaceId) {
    throw new AppError("Skill not found", 404);
  }
  const usage = await countSkillUsage(skillId);
  if (usage > 0) {
    throw new AppError(`This skill is currently used by ${usage} member${usage === 1 ? "" : "s"}`, 409);
  }
  return deleteSkill(skillId);
}

module.exports = { listSkillsService, createSkillService, updateSkillService, deleteSkillService };
