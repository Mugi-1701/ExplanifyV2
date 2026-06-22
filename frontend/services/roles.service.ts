import { api } from "@/services/api";

export type WorkspaceRole = {
  id: string;
  workspaceId: string;
  name: string;
  permissions?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

async function getRoles() {
  const { data } = await api.get("/roles");
  return (data?.data ?? data ?? []) as WorkspaceRole[];
}

async function createRole(input: { name: string; permissions?: Record<string, unknown> }) {
  const { data } = await api.post("/roles", input);
  return (data?.data ?? data) as WorkspaceRole;
}

async function updateRole(id: string, input: Partial<{ name: string; permissions: Record<string, unknown> }>) {
  const { data } = await api.patch(`/roles/${id}`, input);
  return (data?.data ?? data) as WorkspaceRole;
}

async function deleteRole(id: string) {
  await api.delete(`/roles/${id}`);
}

export { createRole, deleteRole, getRoles, updateRole };
