import { api } from "@/lib/api";
import type { AIRecommendationData, AIRecommendationResponse } from "@/types/ai";

async function recommendAssignee(projectId: string, requiredSkills: string[]): Promise<AIRecommendationData> {
  if (!projectId) {
    throw new Error("projectId is required");
  }

  const { data } = await api.post<AIRecommendationResponse>(`/projects/${projectId}/ai/recommend-assignee`, {
    requiredSkills,
  });

  if (data && typeof data === "object" && "data" in data && data.data) {
    return data.data;
  }

  throw new Error("Failed to get AI recommendation");
}

export { recommendAssignee };
