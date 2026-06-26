import { api } from "@/lib/api";
import type {
  AIRecommendationData,
  AIRecommendationResponse,
  AIWorkloadAnalysisResponse,
  AIWorkloadMember,
} from "@/types/ai";

async function recommendAssignee(projectId: string, requiredSkills: string[]): Promise<AIRecommendationData> {
  if (!projectId) {
    throw new Error("projectId is required");
  }

  const { data } = await api.post<AIRecommendationResponse>(`/projects/${projectId}/ai/recommend-assignee`, {
    projectId,
    requiredSkills,
  });

  if (data && typeof data === "object" && "data" in data && data.data) {
    return data.data;
  }

  throw new Error("Failed to get AI recommendation");
}

async function getWorkloadOverview(projectId: string): Promise<AIWorkloadMember[]> {
  if (!projectId) {
    throw new Error("projectId is required");
  }

  const { data } = await api.get<AIWorkloadAnalysisResponse>(`/projects/${projectId}/ai/workload`);

  if (data && typeof data === "object" && "data" in data && data.data && Array.isArray(data.data.members)) {
    return data.data.members.map((member) => ({
      memberId: member.memberId,
      memberName: member.name,
      activeTasks: member.activeTasks,
      calendarHours: member.calendarHours,
      utilization: member.utilization,
      status: member.status,
    }));
  }

  throw new Error("Failed to get workload overview");
}

async function getWorkloadAnalysis(projectId: string) {
  if (!projectId) {
    throw new Error("projectId is required");
  }

  const { data } = await api.get<AIWorkloadAnalysisResponse>(`/projects/${projectId}/ai/workload`);

  if (data && typeof data === "object" && "data" in data && data.data) {
    return data.data;
  }

  throw new Error("Failed to get workload analysis");
}

export { getWorkloadAnalysis, getWorkloadOverview, recommendAssignee };
