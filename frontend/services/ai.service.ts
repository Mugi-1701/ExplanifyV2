import { api } from "@/lib/api";
import type { AIRecommendationData, AIRecommendationResponse, AIWorkloadMember, AIWorkloadResponse } from "@/types/ai";

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

  const { data } = await api.get<AIWorkloadResponse>(`/projects/${projectId}/ai/workload`);

  if (data && typeof data === "object" && "data" in data && Array.isArray(data.data)) {
    return data.data;
  }

  throw new Error("Failed to get workload overview");
}

export { getWorkloadOverview, recommendAssignee };
