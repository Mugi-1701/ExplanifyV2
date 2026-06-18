const { asyncHandler } = require("../../utils/async-handler");
const { AppError } = require("../../utils/AppError");
const { recommendAssignee } = require("./service");

const recommendAssigneeHandler = asyncHandler(async (req, res) => {
  const projectId = req.params.projectId ?? req.params.id;
  if (!projectId) {
    throw new AppError("projectId is required", 400);
  }

  const recommendation = await recommendAssignee({
    projectId,
    userId: req.auth.userId,
    requiredSkills: req.body.requiredSkills ?? [],
  });

  res.status(200).json({ data: recommendation });
});

module.exports = {
  recommendAssigneeHandler,
};
