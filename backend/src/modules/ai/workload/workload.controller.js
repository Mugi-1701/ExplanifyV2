const { asyncHandler } = require("../../../utils/async-handler");
const { AppError } = require("../../../utils/AppError");
const { analyzeProjectWorkload } = require("./workload.service");

const getProjectWorkload = asyncHandler(async (req, res) => {
  const projectId = req.params.projectId;
  if (!projectId) {
    throw new AppError("projectId is required", 400);
  }

  const result = await analyzeProjectWorkload(projectId, req.auth.userId);
  return res.status(200).json({ data: result });
});

module.exports = { getProjectWorkload };
