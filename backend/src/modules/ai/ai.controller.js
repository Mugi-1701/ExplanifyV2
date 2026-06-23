const { asyncHandler } = require("../../utils/async-handler");
const { AppError } = require("../../utils/AppError");
const { recommendAssignee, getProjectWorkload, getRebalancingSuggestions } = require("./ai.service");

const recommendAssigneeHandler = asyncHandler(async (req, res) => {
  const projectId = req.params.projectId ?? req.body.projectId;
  if (!projectId) {
    throw new AppError("projectId is required", 400);
  }

  // Temporary debug trace for recommend-assignee requests.
  // eslint-disable-next-line no-console
  console.log("PROJECT ID:", projectId);
  // eslint-disable-next-line no-console
  console.log("REQUEST BODY:", req.body);

  try {
    const recommendation = await recommendAssignee({
      projectId,
      userId: req.auth.userId,
      requiredSkills: req.body.requiredSkills ?? [],
    });

    return res.status(200).json({ data: recommendation });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log("RECOMMENDATION ERROR:", error);
    throw error;
  }
});

const getProjectWorkloadHandler = asyncHandler(async (req, res) => {
  const projectId = req.params.projectId;
  if (!projectId) {
    throw new AppError("projectId is required", 400);
  }

  const workload = await getProjectWorkload({
    projectId,
    userId: req.auth.userId,
  });

  return res.status(200).json({ data: workload });
});

const getRebalanceSuggestions = asyncHandler(async (req, res) => {
  const projectId = req.params.projectId;
  if (!projectId) {
    throw new AppError("projectId is required", 400);
  }

  const result = await getRebalancingSuggestions({
    projectId,
    userId: req.auth.userId,
  });

  return res.status(200).json(result);
});

module.exports = {
  recommendAssigneeHandler,
  getProjectWorkloadHandler,
  getRebalanceSuggestions,
};
