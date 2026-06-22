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

export async function getTeamMembers(teamId: string) {
  try {
    const { data } = await api.get(`/teams/${teamId}/members`);
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object" && "data" in data) return (data as { data: any[] }).data || [];
    return [];
  } catch (e) {
    return [];
  }
}
