import { api } from "@/lib/api";
import type { KanbanInsightsData, KanbanInsightsResponse } from "@/types/kanban-ai";

async function getKanbanInsights(projectId: string): Promise<KanbanInsightsData> {
  if (!projectId) {
    throw new Error("projectId is required");
  }

  const { data } = await api.get<KanbanInsightsResponse>(`/ai/kanban-insights/${projectId}`);

  if (data && typeof data === "object" && "data" in data && data.data) {
    return data.data;
  }

  throw new Error("Failed to get Kanban insights");
}

export { getKanbanInsights };
