export type AIWorkloadMember = {
  memberId: string;
  memberName: string;
  activeTasks: number;
  calendarHours: number;
  utilization: number;
  status: "AVAILABLE" | "HEALTHY" | "BUSY" | "OVERLOADED";
};

export type AIWorkloadResponse = {
  data: AIWorkloadMember[];
};

export type AIWorkloadAnalysisMember = {
  memberId: string;
  name: string;
  workload: number;
  calendarHours: number;
  activeTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  completedTasks: number;
  utilization: number;
  status: "AVAILABLE" | "HEALTHY" | "BUSY" | "OVERLOADED";
};

export type AIWorkloadRecommendation = {
  taskId: string;
  taskTitle: string;
  from: string;
  to: string;
  priority?: "HIGH" | "MEDIUM" | "LOW";
  confidence?: "HIGH" | "MEDIUM" | "LOW";
  reason: string[];
};

export type AIWorkloadAnalysisResponse = {
  data: {
    status: "IMBALANCED" | "BALANCED";
    projectHealth: number;
    members: AIWorkloadAnalysisMember[];
    recommendations: AIWorkloadRecommendation[];
  };
};
