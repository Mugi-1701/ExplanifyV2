import type { KanbanColumnId } from "@/services/kanban.service";

export type KanbanInsightTone = "good" | "neutral" | "warn" | "critical";

export type KanbanInsightProjectHealth = {
  score: number;
  label: string;
  tone: KanbanInsightTone;
  reason: string;
};

export type KanbanInsightWorkflowSummary = {
  totalTasks: number;
  ready: number;
  blocked: number;
  overdue: number;
  idle: number;
  inProgress: number;
  review: number;
  completed: number;
  unassigned: number;
  recommendedMoves: number;
};

export type KanbanInsightColumnHealth = {
  columnId: KanbanColumnId;
  score: number;
  label: string;
  tone: KanbanInsightTone;
  taskCount: number;
  blockedCount: number;
  overdueCount: number;
  idleCount: number;
  readyCount: number;
  reason: string;
};

export type KanbanInsightTask = {
  id: string;
  title: string;
  status: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  dueDate: string | null;
  assigneeName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  ageDays: number;
  columnId: KanbanColumnId;
  reason: string;
  blockingTasks?: {
    id: string;
    title: string;
    status: string;
  }[];
};

export type KanbanInsightRecommendationKind = "BLOCKED" | "OVERDUE" | "IDLE" | "REBALANCE";

export type KanbanInsightRecommendation = {
  id: string;
  kind: KanbanInsightRecommendationKind;
  taskId: string;
  taskTitle: string;
  currentColumn: KanbanColumnId | null;
  assigneeName: string | null;
  title: string;
  summary: string;
  reason: string[];
  priority: "HIGH" | "MEDIUM" | "LOW";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  from?: string;
  to?: string;
};

export type KanbanInsightsData = {
  projectId: string;
  projectHealth: KanbanInsightProjectHealth;
  workflowSummary: KanbanInsightWorkflowSummary;
  columnHealth: Record<KanbanColumnId, KanbanInsightColumnHealth>;
  readyTasks: KanbanInsightTask[];
  blockedTasks: KanbanInsightTask[];
  overdueTasks: KanbanInsightTask[];
  idleTasks: KanbanInsightTask[];
  recommendations: KanbanInsightRecommendation[];
  workload: {
    status: "IMBALANCED" | "BALANCED";
    projectHealth: number;
  };
};

export type KanbanInsightsResponse = {
  data: KanbanInsightsData;
};
