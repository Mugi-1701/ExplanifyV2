/**
 * computeCoordinationState(task)
 * - Accepts a task object that MAY include `dependencies` with `dependsOnTask`
 * - Returns: { coordinationState, isBlocked, blockingTasks, coordinationReason }
 */
function computeCoordinationState(task) {
  if (!task) {
    return {
      coordinationState: "READY",
      isBlocked: false,
      blockingTasks: [],
      coordinationReason: "Task not found",
    };
  }

  // DONE takes highest precedence
  if (task.status === "DONE") {
    return {
      coordinationState: "DONE",
      isBlocked: false,
      blockingTasks: [],
      coordinationReason: "Task completed",
    };
  }

  const deps = Array.isArray(task.dependencies) ? task.dependencies : [];

  // Determine blocking tasks
  const blocking = [];
  for (const d of deps) {
    const t = d.dependsOnTask;
    if (!t) {
      blocking.push({ id: d.dependsOnTaskId, title: "unknown", status: "UNKNOWN" });
      continue;
    }

    if (t.status !== "DONE") {
      blocking.push({ id: t.id, title: t.title || "(untitled)", status: t.status });
    }
  }

  if (blocking.length > 0) {
    const titles = blocking.map((b) => b.title).join(", ");
    const reason = blocking.length === 1 ? `Waiting for ${titles}` : `Waiting for ${titles}`;
    return {
      coordinationState: "BLOCKED",
      isBlocked: true,
      blockingTasks: blocking,
      coordinationReason: reason,
    };
  }

  // No blocking tasks
  if (task.status === "IN_PROGRESS") {
    return {
      coordinationState: "ACTIVE",
      isBlocked: false,
      blockingTasks: [],
      coordinationReason: "Currently in progress",
    };
  }

  // If task is TODO and all deps done => READY
  if (task.status === "TODO") {
    return {
      coordinationState: "READY",
      isBlocked: false,
      blockingTasks: [],
      coordinationReason: "Ready to start",
    };
  }

  // Default fallback: reflect status but mark as READY-like
  return {
    coordinationState: "READY",
    isBlocked: false,
    blockingTasks: [],
    coordinationReason: "All dependencies completed",
  };
}

// backward-compatible alias
function getTaskBlockingState(task) {
  const out = computeCoordinationState(task);
  return {
    isBlocked: out.isBlocked,
    blockingTasks: out.blockingTasks,
    coordinationReason: out.coordinationReason,
  };
}

module.exports = {
  computeCoordinationState,
  getTaskBlockingState,
};
