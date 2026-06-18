const { asyncHandler } = require("../../utils/async-handler");
const { getProjectEventHistory } = require("./service");
const { getProjectService } = require("../projects/project.service");

const listProjectEvents = asyncHandler(async (req, res) => {
  await getProjectService({
    projectId: req.params.projectId,
    userId: req.auth.userId,
  });

  const events = await getProjectEventHistory({ projectId: req.params.projectId });
  res.status(200).json({ data: events });
});

module.exports = {
  listProjectEvents,
};
