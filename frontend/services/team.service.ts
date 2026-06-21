import { api } from "@/lib/api";

export type Team = {
  id: string;
  orgId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    members: number;
  };
};

export async function getTeams(orgId?: string): Promise<Team[]> {
  const params = orgId ? { orgId } : undefined;
  const { data } = await api.get("/teams", { params });
  
  if (Array.isArray(data)) {
    return data;
  }
  
  if (data && typeof data === "object" && "data" in data) {
    return (data as { data: Team[] }).data || [];
  }
  
  return [];
}
