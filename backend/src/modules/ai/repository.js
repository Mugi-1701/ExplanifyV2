const { findProjectById } = require("../projects/project.repository");

const getProjectRecommendationContext = async (projectId) => {
  const project = await findProjectById(projectId);
  if (!project) {
    return null;
  }

  return {
    id: project.id,
    orgId: project.orgId,
    members: project.members ?? [],
    tasks: project.tasks ?? [],
  };
};

module.exports = {
  getProjectRecommendationContext,
};
