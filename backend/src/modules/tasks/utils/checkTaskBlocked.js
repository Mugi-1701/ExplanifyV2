const taskRepository = require("../task.repository");

/**
 * checkIfTaskBlocked(taskId)
 * - returns { isBlocked: boolean, blockingReasons: string[] }
 */
async function checkIfTaskBlocked(taskId) {
  const dependencies = await taskRepository.getDependenciesByTaskId(taskId);

  // dependencies include dependsOnTask
  const incomplete = dependencies.filter((d) => {
    const t = d.dependsOnTask;
    // consider status 'DONE' as completed
    return !(t && t.status === "DONE");
  });

  const blockingReasons = incomplete.map((d) => d.dependsOnTask?.title || d.dependsOnTaskId);

  return {
    isBlocked: incomplete.length > 0,
    blockingReasons,
  };
}

module.exports = {
  checkIfTaskBlocked,
};
