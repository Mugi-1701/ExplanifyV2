const { analyzeProjectWorkload } = require("./workload/workload.service");
const { getTasksByProject } = require("../tasks/task.service");

const DAY_MS = 86_400_000;
const IDLE_THRESHOLD_DAYS = 5;
const COLUMN_IDS = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toTimestamp(value) {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function formatDays(days) {
  return `${Math.max(0, days)}d`;
}

function getAgeDays(task, now) {
  const source = task.updatedAt ?? task.createdAt ?? task.dueDate ?? null;
  const timestamp = toTimestamp(source);

  if (timestamp === null) {
    return 0;
  }

  return Math.max(0, Math.floor((now - timestamp) / DAY_MS));
}

function getOverdueDays(task, now) {
  if (!task.dueDate) {
    return 0;
  }

  const dueDate = toTimestamp(task.dueDate);
  if (dueDate === null || dueDate >= now) {
    return 0;
  }

  return Math.max(1, Math.ceil((now - dueDate) / DAY_MS));
}

function getKanbanColumnId(status) {
  switch (status) {
    case "IN_PROGRESS":
      return "IN_PROGRESS";
    case "IN_REVIEW":
      return "REVIEW";
    case "DONE":
      return "DONE";
    case "TODO":
    case "BLOCKED":
    case "CANCELED":
    case "ARCHIVED":
    default:
      return "TODO";
  }
}

function getInsightKindWeight(kind) {
  switch (kind) {
    case "BLOCKED":
      return 4;
    case "OVERDUE":
      return 3;
    case "IDLE":
      return 2;
    case "REBALANCE":
      return 1;
    default:
      return 0;
  }
}

function getPriorityWeight(priority) {
  switch (priority) {
    case "HIGH":
      return 3;
    case "MEDIUM":
      return 2;
    case "LOW":
      return 1;
    default:
      return 0;
  }
}

function getColumnTone(score, isDoneColumn, taskCount) {
  if (isDoneColumn) {
    if (taskCount === 0) {
      return "neutral";
    }

    return "good";
  }

  if (score >= 85) return "good";
  if (score >= 65) return "neutral";
  if (score >= 45) return "warn";
  return "critical";
}

function getColumnLabel(score, isDoneColumn, taskCount, blockedCount, overdueCount, idleCount, readyCount) {
  if (taskCount === 0) {
    return "Empty";
  }

  if (isDoneColumn) {
    return "Complete";
  }

  if (blockedCount > 0 || overdueCount > 0) {
    return "Needs attention";
  }

  if (idleCount > 0) {
    return "Watch";
  }

  if (readyCount > 0) {
    return "Ready";
  }

  if (score >= 65) {
    return "Healthy";
  }

  return "Watch";
}

function getProjectHealthLabel(score) {
  if (score >= 85) return "Healthy";
  if (score >= 65) return "Stable";
  if (score >= 45) return "Watch";
  return "Critical";
}

function buildProjectHealthReason({ totalTasks, readyCount, blockedCount, overdueCount, idleCount, completedCount }) {
  if (totalTasks === 0) {
    return "No tasks yet. Add work to start tracking Kanban health.";
  }

  if (overdueCount > 0) {
    return `${overdueCount} overdue task${overdueCount === 1 ? "" : "s"} need attention.`;
  }

  if (blockedCount > 0) {
    return `${blockedCount} blocked task${blockedCount === 1 ? "" : "s"} are waiting on dependencies.`;
  }

  if (idleCount > 0) {
    return `${idleCount} idle task${idleCount === 1 ? "" : "s"} have not moved in ${IDLE_THRESHOLD_DAYS}+ days.`;
  }

  if (completedCount === totalTasks) {
    return "All tasks are completed.";
  }

  if (readyCount > 0) {
    return `${readyCount} task${readyCount === 1 ? "" : "s"} are ready to pull into the next stage.`;
  }

  return "Workflow is steady.";
}

function buildRecommendation({
  kind,
  task,
  title,
  summary,
  reason,
  priority = "MEDIUM",
  confidence = "MEDIUM",
  from,
  to,
}) {
  return {
    id: `${kind.toLowerCase()}-${task.id}`,
    kind,
    taskId: task.id,
    taskTitle: task.title,
    currentColumn: getKanbanColumnId(task.status),
    assigneeName: task.assignee?.name ?? null,
    title,
    summary,
    reason,
    priority,
    confidence,
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  };
}

function buildBlockedRecommendation(task) {
  const blockingTasks = Array.isArray(task.blockingTasks) ? task.blockingTasks : [];
  const blockers = blockingTasks.slice(0, 3).map((blockingTask) => blockingTask.title).filter(Boolean);
  const summary = blockers.length > 0 ? `Waiting on ${blockers.join(", ")}.` : "Waiting on unresolved dependencies.";

  return buildRecommendation({
    kind: "BLOCKED",
    task,
    title: `Unblock ${task.title}`,
    summary,
    reason: [
      task.coordinationReason || "Task is blocked by dependencies.",
      blockers.length > 0 ? `Dependencies: ${blockers.join(", ")}` : "Dependencies are still incomplete.",
    ],
    priority: "HIGH",
    confidence: blockers.length > 0 ? "HIGH" : "MEDIUM",
  });
}

function buildOverdueRecommendation(task, now) {
  const overdueDays = getOverdueDays(task, now);
  const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "unassigned deadline";

  return buildRecommendation({
    kind: "OVERDUE",
    task,
    title: `Prioritize ${task.title}`,
    summary: `Due ${dueDate} and overdue by ${formatDays(overdueDays)}.`,
    reason: [
      `Due date passed ${formatDays(overdueDays)} ago`,
      task.assignee?.name ? `Assigned to ${task.assignee.name}` : "Task is currently unassigned",
    ],
    priority: overdueDays >= 3 ? "HIGH" : "MEDIUM",
    confidence: overdueDays >= 2 ? "HIGH" : "MEDIUM",
  });
}

function buildIdleRecommendation(task, ageDays) {
  return buildRecommendation({
    kind: "IDLE",
    task,
    title: `Revisit ${task.title}`,
    summary: `Task has been idle for ${formatDays(ageDays)}.`,
    reason: [
      `No movement in ${formatDays(ageDays)}`,
      task.assignee?.name ? `Assigned to ${task.assignee.name}` : "Task is unassigned",
    ],
    priority: ageDays >= 10 ? "HIGH" : "MEDIUM",
    confidence: ageDays >= 7 ? "HIGH" : "MEDIUM",
  });
}

function buildRebalanceRecommendation(recommendation) {
  return {
    id: `rebalance-${recommendation.taskId}`,
    kind: "REBALANCE",
    taskId: recommendation.taskId,
    taskTitle: recommendation.taskTitle,
    currentColumn: null,
    assigneeName: null,
    title: `Rebalance ${recommendation.taskTitle}`,
    summary: `Move work from ${recommendation.from} to ${recommendation.to}.`,
    reason: recommendation.reason,
    priority: recommendation.priority ?? "LOW",
    confidence: recommendation.confidence ?? "LOW",
    from: recommendation.from,
    to: recommendation.to,
  };
}

function getTaskSummaryFlags(task, now) {
  const ageDays = getAgeDays(task, now);
  const overdueDays = getOverdueDays(task, now);
  const isBlocked = Boolean(task.isBlocked || task.status === "BLOCKED");
  const isOverdue = overdueDays > 0;
  const isIdle = !isBlocked && !isOverdue && ["TODO", "IN_PROGRESS", "IN_REVIEW"].includes(task.status) && ageDays >= IDLE_THRESHOLD_DAYS;
  const isReady = !isBlocked && !isOverdue && task.status === "TODO";

  return {
    ageDays,
    overdueDays,
    isBlocked,
    isOverdue,
    isIdle,
    isReady,
  };
}

function buildColumnHealth(columnId, tasks) {
  const taskCount = tasks.length;
  const blockedCount = tasks.filter((task) => task.isBlocked).length;
  const overdueCount = tasks.filter((task) => task.isOverdue).length;
  const idleCount = tasks.filter((task) => task.isIdle).length;
  const readyCount = tasks.filter((task) => task.isReady).length;
  const completedCount = columnId === "DONE" ? taskCount : 0;

  if (taskCount === 0) {
    return {
      columnId,
      score: 72,
      label: "Empty",
      tone: "neutral",
      taskCount,
      blockedCount,
      overdueCount,
      idleCount,
      readyCount,
      reason: "No tasks in this column yet.",
    };
  }

  const score = clamp(100 - (blockedCount * 25) - (overdueCount * 20) - (idleCount * 8) + (columnId === "DONE" ? Math.min(10, completedCount * 2) : 0), 0, 100);

  return {
    columnId,
    score,
    label: getColumnLabel(score, columnId === "DONE", taskCount, blockedCount, overdueCount, idleCount, readyCount),
    tone: getColumnTone(score, columnId === "DONE", taskCount),
    taskCount,
    blockedCount,
    overdueCount,
    idleCount,
    readyCount,
    reason:
      overdueCount > 0
        ? `${overdueCount} overdue task${overdueCount === 1 ? "" : "s"} need attention.`
        : blockedCount > 0
          ? `${blockedCount} blocked task${blockedCount === 1 ? "" : "s"} need dependency resolution.`
          : idleCount > 0
            ? `${idleCount} idle task${idleCount === 1 ? "" : "s"} have slowed down.`
            : columnId === "DONE"
              ? "Work is landing here."
              : readyCount > 0
                ? `${readyCount} task${readyCount === 1 ? "" : "s"} are ready to move forward.`
                : "Column is flowing normally.",
  };
}

function sortRecommendations(left, right) {
  const leftWeight = (getInsightKindWeight(left.kind) * 10) + getPriorityWeight(left.priority);
  const rightWeight = (getInsightKindWeight(right.kind) * 10) + getPriorityWeight(right.priority);

  if (leftWeight !== rightWeight) {
    return rightWeight - leftWeight;
  }

  return left.taskTitle.localeCompare(right.taskTitle);
}

async function getKanbanInsights(projectId, orgId, userId) {
  if (!projectId) {
    throw new Error("projectId is required");
  }

  const [tasks, workloadAnalysis] = await Promise.all([
    getTasksByProject(orgId, projectId),
    analyzeProjectWorkload(projectId, userId),
  ]);

  const now = Date.now();
  const enrichedTasks = tasks.map((task) => {
    const summaryFlags = getTaskSummaryFlags(task, now);
    return {
      ...task,
      columnId: getKanbanColumnId(task.status),
      ...summaryFlags,
    };
  });

  const groupedByColumn = COLUMN_IDS.reduce((acc, columnId) => {
    acc[columnId] = enrichedTasks.filter((task) => task.columnId === columnId);
    return acc;
  }, {});

  const readyTasks = enrichedTasks.filter((task) => task.isReady);
  const blockedTasks = enrichedTasks.filter((task) => task.isBlocked);
  const overdueTasks = enrichedTasks.filter((task) => task.isOverdue);
  const idleTasks = enrichedTasks.filter((task) => task.isIdle);
  const completedCount = enrichedTasks.filter((task) => task.status === "DONE").length;
  const inProgressCount = enrichedTasks.filter((task) => task.status === "IN_PROGRESS").length;
  const reviewCount = enrichedTasks.filter((task) => task.status === "IN_REVIEW").length;
  const unassignedCount = enrichedTasks.filter((task) => !task.assigneeId).length;

  const readyLead = readyTasks.slice(0, 2);
  const blockedLead = blockedTasks.slice(0, 2);
  const overdueLead = overdueTasks.slice(0, 2);
  const idleLead = idleTasks.slice(0, 2);

  const recommendations = [
    ...blockedLead.map((task) => buildBlockedRecommendation(task)),
    ...overdueLead.map((task) => buildOverdueRecommendation(task, now)),
    ...idleLead.map((task) => buildIdleRecommendation(task, task.ageDays)),
  ];

  if (Array.isArray(workloadAnalysis.recommendations)) {
    const rebalanceRecommendations = workloadAnalysis.recommendations.slice(0, 2).map(buildRebalanceRecommendation);
    recommendations.push(...rebalanceRecommendations);
  }

  const uniqueRecommendations = [];
  const seenTaskIds = new Set();

  for (const recommendation of recommendations.sort(sortRecommendations)) {
    if (seenTaskIds.has(recommendation.taskId)) {
      continue;
    }

    seenTaskIds.add(recommendation.taskId);
    uniqueRecommendations.push(recommendation);
  }

  const blockedCount = blockedTasks.length;
  const overdueCount = overdueTasks.length;
  const idleCount = idleTasks.length;
  const readyCount = readyTasks.length;
  const totalTasks = enrichedTasks.length;

  let projectHealthScore = totalTasks === 0 ? 100 : 60;
  if (totalTasks > 0) {
    const completionBonus = Math.round((completedCount / totalTasks) * 40);
    const flowBonus = Math.min(20, (readyCount * 4) + (inProgressCount * 2) + (reviewCount * 2));
    const penalties = (blockedCount * 18) + (overdueCount * 22) + (idleCount * 6) + (Math.max(0, unassignedCount - readyCount) * 2);
    projectHealthScore = clamp(projectHealthScore + completionBonus + flowBonus - penalties, 0, 100);
  }

  if (completedCount === totalTasks && totalTasks > 0) {
    projectHealthScore = 100;
  }

  const projectHealth = {
    score: projectHealthScore,
    label: getProjectHealthLabel(projectHealthScore),
    tone: projectHealthScore >= 85 ? "good" : projectHealthScore >= 65 ? "neutral" : projectHealthScore >= 45 ? "warn" : "critical",
    reason: buildProjectHealthReason({
      totalTasks,
      readyCount,
      blockedCount,
      overdueCount,
      idleCount,
      completedCount,
    }),
  };

  const workflowSummary = {
    totalTasks,
    ready: readyCount,
    blocked: blockedCount,
    overdue: overdueCount,
    idle: idleCount,
    inProgress: inProgressCount,
    review: reviewCount,
    completed: completedCount,
    unassigned: unassignedCount,
    recommendedMoves: uniqueRecommendations.length,
  };

  const columnHealth = COLUMN_IDS.reduce((acc, columnId) => {
    acc[columnId] = buildColumnHealth(columnId, groupedByColumn[columnId]);
    return acc;
  }, {});

  return {
    projectId,
    projectHealth,
    workflowSummary,
    columnHealth,
    readyTasks: readyLead.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority ?? "MEDIUM",
      dueDate: task.dueDate ?? null,
      assigneeName: task.assignee?.name ?? null,
      createdAt: task.createdAt ?? null,
      updatedAt: task.updatedAt ?? null,
      ageDays: task.ageDays,
      columnId: task.columnId,
      reason: task.coordinationReason ?? "Ready to work",
    })),
    blockedTasks: blockedLead.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority ?? "MEDIUM",
      dueDate: task.dueDate ?? null,
      assigneeName: task.assignee?.name ?? null,
      createdAt: task.createdAt ?? null,
      updatedAt: task.updatedAt ?? null,
      ageDays: task.ageDays,
      columnId: task.columnId,
      reason: task.coordinationReason ?? "Blocked by dependencies",
      blockingTasks: Array.isArray(task.blockingTasks)
        ? task.blockingTasks.map((blockingTask) => ({
            id: blockingTask.id,
            title: blockingTask.title,
            status: blockingTask.status,
          }))
        : [],
    })),
    overdueTasks: overdueLead.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority ?? "MEDIUM",
      dueDate: task.dueDate ?? null,
      assigneeName: task.assignee?.name ?? null,
      createdAt: task.createdAt ?? null,
      updatedAt: task.updatedAt ?? null,
      ageDays: task.ageDays,
      columnId: task.columnId,
      reason: task.dueDate ? `Overdue by ${formatDays(getOverdueDays(task, now))}` : "Past due",
    })),
    idleTasks: idleLead.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority ?? "MEDIUM",
      dueDate: task.dueDate ?? null,
      assigneeName: task.assignee?.name ?? null,
      createdAt: task.createdAt ?? null,
      updatedAt: task.updatedAt ?? null,
      ageDays: task.ageDays,
      columnId: task.columnId,
      reason: `Idle for ${formatDays(task.ageDays)}`,
    })),
    recommendations: uniqueRecommendations,
    workload: {
      status: workloadAnalysis.status,
      projectHealth: workloadAnalysis.projectHealth,
    },
  };
}

module.exports = {
  getKanbanInsights,
};
