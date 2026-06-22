import { api } from "@/services/api";

export type WorkspaceSkill = {
  id: string;
  workspaceId: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

async function getSkills() {
  const { data } = await api.get("/skills");
  return (data?.data ?? data ?? []) as WorkspaceSkill[];
}

async function createSkill(input: { name: string }) {
  const { data } = await api.post("/skills", input);
  return (data?.data ?? data) as WorkspaceSkill;
}

async function updateSkill(id: string, input: Partial<{ name: string }>) {
  const { data } = await api.patch(`/skills/${id}`, input);
  return (data?.data ?? data) as WorkspaceSkill;
}

async function deleteSkill(id: string) {
  await api.delete(`/skills/${id}`);
}

export { createSkill, deleteSkill, getSkills, updateSkill };
