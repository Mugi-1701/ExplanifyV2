import { api } from "@/lib/api";

export type WorkspaceUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
};

async function getUsers(): Promise<WorkspaceUser[]> {
  const { data } = await api.get("/users");

  if (Array.isArray(data)) {
    return data as WorkspaceUser[];
  }

  if (data && typeof data === "object" && "data" in data) {
    return ((data as { data?: WorkspaceUser[] }).data ?? []) as WorkspaceUser[];
  }

  return [];
}

export { getUsers };
